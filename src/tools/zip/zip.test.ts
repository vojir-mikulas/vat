import { describe, expect, it } from 'vitest'
import { unzipSync, strFromU8, strToU8 } from 'fflate'

import { createZip } from './zip'

describe('zip', () => {
  it('creates a zip that round-trips through unzip', () => {
    const zipped = createZip([
      { name: 'a.txt', data: strToU8('hello') },
      { name: 'dir/b.txt', data: strToU8('world') },
    ])
    const out = unzipSync(zipped)
    expect(Object.keys(out).sort()).toEqual(['a.txt', 'dir/b.txt'])
    expect(strFromU8(out['a.txt']!)).toBe('hello')
    expect(strFromU8(out['dir/b.txt']!)).toBe('world')
  })
})
