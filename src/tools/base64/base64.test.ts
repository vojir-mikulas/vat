import { describe, expect, it } from 'vitest'

import { decodeBase64, encodeBase64 } from './base64'

describe('base64', () => {
  it('round-trips ASCII', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=')
    expect(decodeBase64('aGVsbG8=')).toBe('hello')
  })

  it('handles UTF-8 (multi-byte) characters', () => {
    const s = 'Příliš žluťoučký kůň 🐎'
    expect(decodeBase64(encodeBase64(s))).toBe(s)
  })

  it('produces URL-safe output without padding', () => {
    const enc = encodeBase64('<<???>>', true)
    expect(enc).not.toMatch(/[+/=]/)
    expect(decodeBase64(enc)).toBe('<<???>>')
  })

  it('decodes tolerantly (url-safe alphabet, missing padding, whitespace)', () => {
    expect(decodeBase64('aGVsbG8')).toBe('hello')
    expect(decodeBase64('aGVs bG8=')).toBe('hello')
  })

  it('throws on invalid input', () => {
    expect(() => decodeBase64('!!!!')).toThrow()
    expect(() => decodeBase64('a')).toThrow()
  })
})
