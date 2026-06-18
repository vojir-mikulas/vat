import { describe, expect, it } from 'vitest'

import { hashAll, hashText } from './hash'

describe('hash', () => {
  it('computes known digests of "abc"', async () => {
    expect(await hashText('abc', 'md5')).toBe('900150983cd24fb0d6963f7d28e17f72')
    expect(await hashText('abc', 'sha1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
    expect(await hashText('abc', 'sha256')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('hashes the empty string', async () => {
    expect(await hashText('', 'md5')).toBe('d41d8cd98f00b204e9800998ecf8427e')
  })

  it('hashAll returns every algorithm', async () => {
    const all = await hashAll('abc')
    expect(Object.keys(all)).toEqual(['md5', 'sha1', 'sha256', 'sha512'])
    expect(all.sha512).toHaveLength(128)
  })
})
