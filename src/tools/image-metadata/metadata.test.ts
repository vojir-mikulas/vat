import { describe, expect, it } from 'vitest'

import { flattenMetadata, formatMetaValue } from './metadata'

describe('image metadata', () => {
  it('formats primitive, array, and object values', () => {
    expect(formatMetaValue(42)).toBe('42')
    expect(formatMetaValue([1, 2, 3])).toBe('1, 2, 3')
    expect(formatMetaValue({ a: 1 })).toBe('{"a":1}')
    expect(formatMetaValue(null)).toBe('')
  })

  it('flattens and drops empty values', () => {
    const entries = flattenMetadata({ Make: 'Canon', Model: '', ISO: 100 })
    expect(entries).toEqual([
      { key: 'Make', value: 'Canon' },
      { key: 'ISO', value: '100' },
    ])
  })

  it('returns empty for missing metadata', () => {
    expect(flattenMetadata(undefined)).toEqual([])
  })
})
