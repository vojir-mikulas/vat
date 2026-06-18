import { describe, expect, it } from 'vitest'

import { decodeUrl, encodeUrl } from './url'

describe('url', () => {
  it('encodes a component (escapes reserved chars)', () => {
    expect(encodeUrl('a b&c=d')).toBe('a%20b%26c%3Dd')
  })

  it('encodes a whole URL (preserves structure)', () => {
    expect(encodeUrl('https://x.io/a b?q=1&w=2', true)).toBe('https://x.io/a%20b?q=1&w=2')
  })

  it('round-trips', () => {
    const s = 'héllo wörld/ünïcode 🎉'
    expect(decodeUrl(encodeUrl(s))).toBe(s)
  })

  it('throws on malformed escapes', () => {
    expect(() => decodeUrl('%')).toThrow()
  })
})
