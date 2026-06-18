import { describe, expect, it } from 'vitest'
import { gzipSync, strFromU8, strToU8 } from 'fflate'

import { extractTar, isGzip, parseOctal } from './tar'

// Build a minimal (non-ustar) tar with a single regular-file entry. The parser
// ignores the checksum field, so we don't compute one.
function makeTar(name: string, content: string): Uint8Array {
  const enc = new TextEncoder()
  const body = enc.encode(content)
  const header = new Uint8Array(512)
  header.set(enc.encode(name), 0)
  header.set(enc.encode(body.length.toString(8).padStart(11, '0')), 124) // size, octal
  header[156] = '0'.charCodeAt(0) // typeflag: regular file

  const dataBlocks = Math.ceil(body.length / 512) * 512
  const dataBlock = new Uint8Array(dataBlocks)
  dataBlock.set(body, 0)

  const out = new Uint8Array(512 + dataBlocks + 1024) // + two zero end-blocks
  out.set(header, 0)
  out.set(dataBlock, 512)
  return out
}

describe('tar', () => {
  it('detects gzip magic bytes', () => {
    expect(isGzip(gzipSync(strToU8('x')))).toBe(true)
    expect(isGzip(strToU8('plain'))).toBe(false)
  })

  it('parses octal size fields', () => {
    expect(parseOctal(new TextEncoder().encode('0000644\0'))).toBe(0o644)
  })

  it('extracts a plain tar entry', () => {
    const entries = extractTar(makeTar('hello.txt', 'hi there'))
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe('hello.txt')
    expect(strFromU8(entries[0]!.data)).toBe('hi there')
  })

  it('transparently extracts a gzipped tar', () => {
    const entries = extractTar(gzipSync(makeTar('a.txt', 'abc')))
    expect(strFromU8(entries[0]!.data)).toBe('abc')
  })
})
