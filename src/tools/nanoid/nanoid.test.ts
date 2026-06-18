import { describe, expect, it } from 'vitest'

import { generateNanoIds } from './nanoid'

describe('nanoid', () => {
  it('generates ids of the requested size and count', () => {
    const ids = generateNanoIds(12, 4, 'urlSafe')
    expect(ids).toHaveLength(4)
    ids.forEach((id) => expect(id).toHaveLength(12))
  })

  it('respects a preset alphabet', () => {
    const ids = generateNanoIds(16, 3, 'hex')
    ids.forEach((id) => expect(id).toMatch(/^[0-9a-f]{16}$/))
  })

  it('produces unique ids', () => {
    const ids = generateNanoIds(21, 50, 'urlSafe')
    expect(new Set(ids).size).toBe(50)
  })
})
