import { describe, expect, it } from 'vitest'

import { generateUuids } from './uuid'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

describe('uuid', () => {
  it('generates the requested count of valid v4 UUIDs', () => {
    const ids = generateUuids('v4', 5)
    expect(ids).toHaveLength(5)
    ids.forEach((id) => expect(id).toMatch(UUID_RE))
    expect(new Set(ids).size).toBe(5)
  })

  it('returns the nil UUID', () => {
    expect(generateUuids('nil', 2)).toEqual([
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
    ])
  })

  it('clamps the count to at least one', () => {
    expect(generateUuids('v7', 0)).toHaveLength(1)
  })
})
