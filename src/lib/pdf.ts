import { PDFDocument, degrees } from 'pdf-lib'

// Client-side PDF operations via pdf-lib. All run entirely in the browser; the
// only non-DOM helper (parsePageRange) is also reused for input validation.

export async function getPageCount(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes)
  return doc.getPageCount()
}

export async function mergePdfs(buffers: Uint8Array[]): Promise<Uint8Array> {
  const out = await PDFDocument.create()
  for (const buf of buffers) {
    const src = await PDFDocument.load(buf)
    const pages = await out.copyPages(src, src.getPageIndices())
    pages.forEach((p) => out.addPage(p))
  }
  return out.save()
}

// One single-page PDF per page of the source.
export async function splitPdfPages(bytes: Uint8Array): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(bytes)
  const out: Uint8Array[] = []
  for (const i of src.getPageIndices()) {
    const doc = await PDFDocument.create()
    const [page] = await doc.copyPages(src, [i])
    doc.addPage(page)
    out.push(await doc.save())
  }
  return out
}

// New PDF containing only the given (0-based) page indices, in the order given.
export async function extractPages(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes)
  const out = await PDFDocument.create()
  const pages = await out.copyPages(src, indices)
  pages.forEach((p) => out.addPage(p))
  return out.save()
}

// Rotate pages by `angle` (added to any existing rotation). Without `indices`,
// every page is rotated.
export async function rotatePdf(
  bytes: Uint8Array,
  angle: number,
  indices?: number[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes)
  const pages = doc.getPages()
  const targets = indices ?? pages.map((_, i) => i)
  for (const i of targets) {
    const page = pages[i]
    if (!page) continue
    const next = (((page.getRotation().angle + angle) % 360) + 360) % 360
    page.setRotation(degrees(next))
  }
  return doc.save()
}

// Re-save with object streams. This is a structural optimization only (it does not
// re-encode embedded images), so the size reduction is usually modest.
export async function compressPdf(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes)
  return doc.save({ useObjectStreams: true })
}

// Parse a page-range spec like "1-3,5,8-10" into sorted, unique 0-based indices,
// clamped to [1, total]. Unparseable parts are ignored; reversed ranges are
// normalized.
export function parsePageRange(spec: string, total: number): number[] {
  const result = new Set<number>()
  for (const part of spec.split(',')) {
    const s = part.trim()
    const m = /^(\d+)(?:-(\d+))?$/.exec(s)
    if (!m) continue
    let start = parseInt(m[1]!, 10)
    let end = m[2] ? parseInt(m[2], 10) : start
    if (start > end) [start, end] = [end, start]
    for (let p = start; p <= end; p++) {
      if (p >= 1 && p <= total) result.add(p - 1)
    }
  }
  return [...result].sort((a, b) => a - b)
}
