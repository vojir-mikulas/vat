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
