import { describe, expect, it } from 'vitest'

import { runRegex } from './regex'

describe('regex', () => {
  it('finds all global matches with indexes', () => {
    const matches = runRegex('\\d+', 'g', 'a1b22c333')
    expect(matches.map((m) => m.match)).toEqual(['1', '22', '333'])
    expect(matches.map((m) => m.index)).toEqual([1, 3, 6])
  })

  it('returns only the first match without the global flag', () => {
    expect(runRegex('\\d+', '', 'a1b22')).toHaveLength(1)
  })

  it('captures positional and named groups', () => {
    const [m] = runRegex('(?<year>\\d{4})-(\\d{2})', '', '2024-06')
    expect(m?.groups).toEqual(['2024', '06'])
    expect(m?.namedGroups).toEqual({ year: '2024' })
  })

  it('throws on an invalid pattern', () => {
    expect(() => runRegex('(', 'g', 'x')).toThrow()
  })
})
