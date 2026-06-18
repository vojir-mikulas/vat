import { gunzipSync } from 'fflate'

// Minimal TAR extractor. TAR is a sequence of 512-byte headers each followed by
// the file's data padded to a 512-byte boundary. Gzip-compressed tarballs
// (.tar.gz / .tgz) are decompressed first. Long-name (ustar prefix / GNU)
// extensions beyond the 100-byte name field aren't handled.

export interface ArchiveEntry {
  name: string
  data: Uint8Array
}

const BLOCK = 512
const decoder = new TextDecoder()

export function isGzip(data: Uint8Array): boolean {
  return data.length > 2 && data[0] === 0x1f && data[1] === 0x8b
}

export function parseOctal(bytes: Uint8Array): number {
  const s = decoder.decode(bytes).replace(/\0.*$/, '').trim()
  return s ? parseInt(s, 8) || 0 : 0
}

function readString(header: Uint8Array, start: number, length: number): string {
  return decoder.decode(header.subarray(start, start + length)).replace(/\0.*$/, '')
}

export function extractTar(input: Uint8Array): ArchiveEntry[] {
  const data = isGzip(input) ? gunzipSync(input) : input
  const entries: ArchiveEntry[] = []
  let offset = 0

  while (offset + BLOCK <= data.length) {
    const header = data.subarray(offset, offset + BLOCK)
    const name = readString(header, 0, 100)
    if (name === '') break // zero block marks end of archive

    const size = parseOctal(header.subarray(124, 136))
    const typeFlag = String.fromCharCode(header[156] ?? 0)
    const dataStart = offset + BLOCK

    // '0' or NUL = regular file; skip directories ('5') and other entry types.
    if (typeFlag === '0' || typeFlag === '\0') {
      entries.push({ name, data: data.slice(dataStart, dataStart + size) })
    }

    offset = dataStart + Math.ceil(size / BLOCK) * BLOCK
  }
  return entries
}
