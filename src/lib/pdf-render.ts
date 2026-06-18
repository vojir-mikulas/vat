import type { PDFDocumentProxy } from 'pdfjs-dist'

// Page rendering via pdf.js, kept separate from the pdf-lib editing helpers in
// pdf.ts. pdf-lib can rearrange/rotate pages but can't rasterize them; pdf.js
// draws them to a canvas, which is what the editor needs for live thumbnails.
// pdf.js is heavy, so it's imported dynamically the first time a page renders.

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then(async (pdfjs) => {
      // Bundled worker URL (Vite resolves `?url` to an emitted asset). Without a
      // worker, pdf.js falls back to the main thread and warns.
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
      return pdfjs
    })
  }
  return pdfjsPromise
}

// Load a document for rendering. The caller owns the proxy and must destroy() it
// when done. pdf.js transfers the buffer to its worker, so we hand it a copy to
// keep the caller's bytes (reused by pdf-lib on export) intact.
export async function loadRenderDoc(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs()
  return pdfjs.getDocument({ data: bytes.slice() }).promise
}

export interface RenderedPage {
  /** data: URL of the rendered page (PNG). */
  url: string
  /** Intrinsic page size in PDF points (unrotated), for aspect-ratio layout. */
  width: number
  height: number
}

// Rasterize a single (1-based) page to a PNG data URL, scaled so its longest side
// is roughly `maxSize` CSS px. Rotation is left to the caller (applied as a cheap
// CSS transform on the thumbnail) so changing rotation never re-renders.
export async function renderPageThumb(
  doc: PDFDocumentProxy,
  pageNumber: number,
  maxSize = 320,
): Promise<RenderedPage> {
  const page = await doc.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const scale = maxSize / Math.max(base.width, base.height)
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  await page.render({ canvas, canvasContext: ctx, viewport }).promise
  page.cleanup()

  return { url: canvas.toDataURL('image/png'), width: base.width, height: base.height }
}
