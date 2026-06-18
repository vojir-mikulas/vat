import { describe, expect, it } from 'vitest'

import { hashAllBytes, hashBytes } from './checksum'

const abc = new TextEncoder().encode('abc')

describe('checksum', () => {
  it('hashes bytes (SHA-256 of "abc")', async () => {
    expect(await hashBytes(abc, 'sha256')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('computes all algorithms', async () => {
    const all = await hashAllBytes(abc)
    expect(all.md5).toBe('900150983cd24fb0d6963f7d28e17f72')
    expect(Object.keys(all)).toEqual(['md5', 'sha1', 'sha256', 'sha512'])
  })
})
