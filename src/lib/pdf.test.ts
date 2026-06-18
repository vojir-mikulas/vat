import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'

import {
  compressPdf,
  extractPages,
  getPageCount,
  mergePdfs,
  parsePageRange,
  rotatePdf,
  splitPdfPages,
} from './pdf'

async function makePdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pages; i++) doc.addPage([200, 200])
  return doc.save()
}

describe('parsePageRange', () => {
  it('parses ranges, singles, and lists', () => {
    expect(parsePageRange('1-3,5', 10)).toEqual([0, 1, 2, 4])
  })
  it('clamps to bounds and dedupes', () => {
    expect(parsePageRange('1,1,2,99', 3)).toEqual([0, 1])
  })
  it('normalizes reversed ranges and ignores junk', () => {
    expect(parsePageRange('3-1, abc, 4', 5)).toEqual([0, 1, 2, 3])
  })
})

describe('pdf operations', () => {
  it('merges page counts', async () => {
    const merged = await mergePdfs([await makePdf(2), await makePdf(3)])
    expect(await getPageCount(merged)).toBe(5)
  })

  it('splits into single-page PDFs', async () => {
    const parts = await splitPdfPages(await makePdf(3))
    expect(parts).toHaveLength(3)
    expect(await getPageCount(parts[0]!)).toBe(1)
  })

  it('extracts selected pages', async () => {
    const out = await extractPages(await makePdf(5), parsePageRange('1,3', 5))
    expect(await getPageCount(out)).toBe(2)
  })

  it('rotates pages', async () => {
    const out = await rotatePdf(await makePdf(1), 90)
    const doc = await PDFDocument.load(out)
    expect(doc.getPages()[0]!.getRotation().angle).toBe(90)
  })

  it('compresses while preserving pages', async () => {
    const out = await compressPdf(await makePdf(4))
    expect(await getPageCount(out)).toBe(4)
  })
})
