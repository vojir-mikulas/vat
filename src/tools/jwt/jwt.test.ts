import { describe, expect, it } from 'vitest'

import { decodeJwt, readClaimDates } from './jwt'

// HS256 token: {alg:HS256,typ:JWT} / {sub:1234567890,name:"John Doe",iat:1516239022}
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

describe('jwt', () => {
  it('decodes header and payload', () => {
    const { header, payload, signature } = decodeJwt(TOKEN)
    expect(header).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 })
    expect(signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
  })

  it('throws on the wrong number of parts', () => {
    expect(() => decodeJwt('a.b')).toThrow()
    expect(() => decodeJwt('a..c')).toThrow()
  })

  it('throws on non-JSON segments', () => {
    expect(() => decodeJwt('bm90anNvbg.bm90anNvbg.sig')).toThrow()
  })

  it('reads registered time claims and flags expiry', () => {
    // now (ms) is after exp (1516242622s), so exp is flagged expired.
    const dates = readClaimDates({ iat: 1516239022, exp: 1516242622 }, 1516243000_000)
    expect(dates.map((d) => d.claim)).toEqual(['iat', 'exp'])
    expect(dates[0]?.date.getUTCFullYear()).toBe(2018)
    expect(dates[1]?.expired).toBe(true)
  })
})
