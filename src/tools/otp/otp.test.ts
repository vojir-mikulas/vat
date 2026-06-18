import { describe, expect, it } from 'vitest'

import { parseOtpUri } from './otp'

describe('parseOtpUri', () => {
  it('parses a full TOTP URI', () => {
    const info = parseOtpUri(
      'otpauth://totp/ACME%20Co:alice@acme.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co&algorithm=SHA256&digits=8&period=60',
    )
    expect(info).toEqual({
      type: 'totp',
      label: 'ACME Co:alice@acme.com',
      issuer: 'ACME Co',
      account: 'alice@acme.com',
      secret: 'JBSWY3DPEHPK3PXP',
      algorithm: 'SHA256',
      digits: 8,
      period: 60,
      counter: undefined,
    })
  })

  it('applies defaults and derives issuer from the label', () => {
    const info = parseOtpUri('otpauth://totp/GitHub:bob?secret=ABC')
    expect(info.issuer).toBe('GitHub')
    expect(info.account).toBe('bob')
    expect(info.algorithm).toBe('SHA1')
    expect(info.digits).toBe(6)
    expect(info.period).toBe(30)
  })

  it('parses HOTP with a counter', () => {
    const info = parseOtpUri('otpauth://hotp/acc?secret=ABC&counter=5')
    expect(info.type).toBe('hotp')
    expect(info.counter).toBe(5)
    expect(info.period).toBeUndefined()
  })

  it('rejects non-otpauth URIs and missing secret', () => {
    expect(() => parseOtpUri('https://example.com')).toThrow()
    expect(() => parseOtpUri('otpauth://totp/acc')).toThrow()
    expect(() => parseOtpUri('otpauth://foo/acc?secret=x')).toThrow()
  })
})
