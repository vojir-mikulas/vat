import { describe, expect, it } from 'vitest'
import { strFromU8, strToU8, zipSync } from 'fflate'

import { extractZip } from './unzip'

describe('unzip', () => {
  it('extracts file entries from a zip', () => {
    const zipped = zipSync({ 'a.txt': strToU8('hello'), 'sub/b.txt': strToU8('world') })
    const entries = extractZip(zipped)
    expect(entries.map((e) => e.name).sort()).toEqual(['a.txt', 'sub/b.txt'])
    expect(strFromU8(entries.find((e) => e.name === 'a.txt')!.data)).toBe('hello')
  })

  it('throws on invalid zip data', () => {
    expect(() => extractZip(strToU8('not a zip'))).toThrow()
  })
})
