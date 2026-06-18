import { describe, expect, it } from 'vitest'

import { formatParts, parseTimestamp, relativeTime } from './timestamp'

describe('timestamp', () => {
  it('parses unix seconds and milliseconds to the same instant', () => {
    expect(parseTimestamp('1516239022')?.toISOString()).toBe('2018-01-18T01:30:22.000Z')
    expect(parseTimestamp('1516239022000')?.toISOString()).toBe('2018-01-18T01:30:22.000Z')
  })

  it('parses date strings', () => {
    expect(parseTimestamp('2018-01-18T01:30:22Z')?.getTime()).toBe(1516239022000)
  })

  it('returns null for invalid input', () => {
    expect(parseTimestamp('not a date')).toBeNull()
    expect(parseTimestamp('')).toBeNull()
  })

  it('formats the parts', () => {
    const parts = formatParts(new Date('2018-01-18T01:30:22Z'))
    expect(parts.unixS).toBe('1516239022')
    expect(parts.unixMs).toBe('1516239022000')
    expect(parts.iso).toBe('2018-01-18T01:30:22.000Z')
  })

  it('describes relative time', () => {
    const now = 1_000_000_000_000
    expect(relativeTime(now - 3600_000, now)).toBe('1 hour ago')
    expect(relativeTime(now + 2 * 86400_000, now)).toBe('in 2 days')
  })
})
