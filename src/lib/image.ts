// Client-side image processing on the Canvas API. The geometry/encoding pipeline
// (processImage) runs only in the browser; the pure helpers below (format/ext
// mapping, aspect math, filename rewriting) are unit-tested.

export const IMAGE_FORMATS = ['png', 'jpeg', 'webp', 'avif'] as const
export type ImageFormat = (typeof IMAGE_FORMATS)[number]

export const FORMAT_MIME: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
}

export const FORMAT_EXT: Record<ImageFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
  avif: 'avif',
}

/** Lossy formats accept a quality (0..1); PNG is lossless and ignores it. */
export function isLossy(format: ImageFormat): boolean {
  return format !== 'png'
}

/** Map a file's MIME type to a supported output format, defaulting to PNG. */
export function formatFromMime(mime: string): ImageFormat {
  if (mime === 'image/jpeg') return 'jpeg'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/avif') return 'avif'
  return 'png'
}

/** Replace a filename's extension, preserving the base name. */
export function replaceExtension(filename: string, ext: string): string {
  const base = filename.replace(/\.[^./\\]+$/, '')
  return `${base || 'image'}.${ext}`
}

export interface TargetSize {
  width?: number
  height?: number
}

// Resolve output dimensions. When `lock` (preserve aspect) is set, a missing
// dimension is derived from the other; if both are given, height follows width.
export function aspectDimensions(
  natWidth: number,
  natHeight: number,
  target: TargetSize,
  lock: boolean,
): { width: number; height: number } {
  const ratio = natWidth / natHeight
  let { width, height } = target
  if (lock) {
    if (width && !height) height = Math.round(width / ratio)
    else if (height && !width) width = Math.round(height * ratio)
    else if (width && height) height = Math.round(width / ratio)
  }
  return {
    width: Math.max(1, Math.round(width || natWidth)),
    height: Math.max(1, Math.round(height || natHeight)),
  }
}

export type Rotation = 0 | 90 | 180 | 270

/** Displayed size after a 90°-step rotation swaps width/height (flips don't). */
export function displayDimensions(
  width: number,
  height: number,
  rotate: Rotation,
): { width: number; height: number } {
  return rotate === 90 || rotate === 270 ? { width: height, height: width } : { width, height }
}

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

// Map an axis-aligned rectangle drawn on the *displayed* (rotated + flipped) image
// back into source-image coordinates. The editor lets the user crop what they see;
// the processing pipeline crops the source first, then rotates — so the displayed
// crop must be expressed as the equivalent source region. Since the only rotations
// are 90° steps the rectangle stays axis-aligned, so mapping its corners and taking
// the bounding box is exact.
export function displayRectToSource(
  rect: CropRect,
  sourceW: number,
  sourceH: number,
  rotate: Rotation,
  flipH: boolean,
  flipV: boolean,
): CropRect {
  const { width: dw, height: dh } = displayDimensions(sourceW, sourceH, rotate)

  const toSource = (X: number, Y: number) => {
    // Centre the display point, undo the rotation, undo the flip, then de-centre
    // into the source frame. Display = R(rotate) · F · source (see processImage),
    // so source = F · R(-rotate) · display.
    const dx = X - dw / 2
    const dy = Y - dh / 2
    let rx: number
    let ry: number
    switch (rotate) {
      case 90:
        rx = dy
        ry = -dx
        break
      case 180:
        rx = -dx
        ry = -dy
        break
      case 270:
        rx = -dy
        ry = dx
        break
      default:
        rx = dx
        ry = dy
    }
    if (flipH) rx = -rx
    if (flipV) ry = -ry
    return { x: rx + sourceW / 2, y: ry + sourceH / 2 }
  }

  const corners = [
    toSource(rect.x, rect.y),
    toSource(rect.x + rect.width, rect.y),
    toSource(rect.x, rect.y + rect.height),
    toSource(rect.x + rect.width, rect.y + rect.height),
  ]
  const xs = corners.map((c) => c.x)
  const ys = corners.map((c) => c.y)
  const x = clampInt(Math.min(...xs), 0, sourceW)
  const y = clampInt(Math.min(...ys), 0, sourceH)
  return {
    x,
    y,
    width: clampInt(Math.max(...xs), 0, sourceW) - x,
    height: clampInt(Math.max(...ys), 0, sourceH) - y,
  }
}

const clampInt = (n: number, min: number, max: number) =>
  Math.round(Math.min(Math.max(n, min), max))

export interface ImageInfo {
  width: number
  height: number
  type: string
  size: number
}

export function loadImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

export function isSvg(file: File): boolean {
  return file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)
}

// Read an SVG's intrinsic pixel size from its width/height attributes, falling back
// to the viewBox and then a default. SVGs are vector and may carry no pixel size,
// so the editor rasterizes them at this size on import.
export function svgPixelSize(svg: string, fallback = 1024): { width: number; height: number } {
  const len = (v: string | null) => {
    if (!v || v.includes('%')) return 0
    const n = parseFloat(v)
    return Number.isFinite(n) && n > 0 ? n : 0
  }
  const el = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement
  let w = len(el.getAttribute('width'))
  let h = len(el.getAttribute('height'))
  if (!w || !h) {
    const vb = el
      .getAttribute('viewBox')
      ?.trim()
      .split(/[\s,]+/)
      .map(Number)
    if (vb && vb.length === 4 && vb[2]! > 0 && vb[3]! > 0) {
      w = w || vb[2]!
      h = h || vb[3]!
    }
  }
  return { width: Math.round(w || fallback), height: Math.round(h || fallback) }
}

// Convert an uploaded SVG into a raster PNG File so the canvas pipeline (which is
// pixel-based) can handle it. Re-serializes with explicit pixel dimensions first,
// since an <img> built from a bare viewBox can rasterize to nothing.
export async function rasterizeSvg(file: File): Promise<File> {
  const text = await file.text()
  const { width, height } = svgPixelSize(text)

  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  doc.documentElement.setAttribute('width', String(width))
  doc.documentElement.setAttribute('height', String(height))
  const markup = new XMLSerializer().serializeToString(doc.documentElement)
  const svgBlob = new Blob([markup], { type: 'image/svg+xml' })

  const img = await loadImageFromFile(svgBlob)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported')
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await canvasToBlob(canvas, 'image/png')
  const base = file.name.replace(/\.svg$/i, '') || 'image'
  return new File([blob], `${base}.png`, { type: 'image/png' })
}

export interface ProcessOptions {
  format: ImageFormat
  quality?: number
  resize?: { width: number; height: number }
  crop?: { x: number; y: number; width: number; height: number }
  rotate?: 0 | 90 | 180 | 270
  flipH?: boolean
  flipV?: boolean
}

export interface ProcessResult {
  blob: Blob
  url: string
  width: number
  height: number
  /** True when the browser couldn't encode the requested format and fell back. */
  formatFallback: boolean
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
      mime,
      quality,
    )
  })
}

// Crop → resize → rotate/flip → encode, in one pass. Each step is optional, so
// every image tool drives this with the subset of options it needs.
export async function processImage(file: File, opts: ProcessOptions): Promise<ProcessResult> {
  const img = await loadImageFromFile(file)

  const sx = opts.crop?.x ?? 0
  const sy = opts.crop?.y ?? 0
  const sw = opts.crop?.width ?? img.naturalWidth
  const sh = opts.crop?.height ?? img.naturalHeight

  const tw = opts.resize?.width ?? sw
  const th = opts.resize?.height ?? sh

  const rot = opts.rotate ?? 0
  const swap = rot === 90 || rot === 270

  const canvas = document.createElement('canvas')
  canvas.width = swap ? th : tw
  canvas.height = swap ? tw : th
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported')

  // JPEG has no alpha — fill white so transparency doesn't turn black.
  if (opts.format === 'jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.translate(canvas.width / 2, canvas.height / 2)
  if (rot) ctx.rotate((rot * Math.PI) / 180)
  ctx.scale(opts.flipH ? -1 : 1, opts.flipV ? -1 : 1)
  ctx.drawImage(img, sx, sy, sw, sh, -tw / 2, -th / 2, tw, th)

  const mime = FORMAT_MIME[opts.format]
  const blob = await canvasToBlob(canvas, mime, opts.quality)
  return {
    blob,
    url: URL.createObjectURL(blob),
    width: canvas.width,
    height: canvas.height,
    formatFallback: blob.type !== mime,
  }
}
