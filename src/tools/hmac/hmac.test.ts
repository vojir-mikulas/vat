import { describe, expect, it } from 'vitest'

import { hmac } from './hmac'

describe('hmac', () => {
  it('matches the RFC test vector (SHA-256)', async () => {
    const digest = await hmac('The quick brown fox jumps over the lazy dog', 'key', 'sha256')
    expect(digest).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8')
  })

  it('supports SHA-1 and SHA-512', async () => {
    expect(await hmac('msg', 'key', 'sha1')).toHaveLength(40)
    expect(await hmac('msg', 'key', 'sha512')).toHaveLength(128)
  })
})
