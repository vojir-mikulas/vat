import { describe, expect, it } from 'vitest'

import { describeCron, nextRuns } from './cron'

describe('cron', () => {
  it('describes an expression in words', () => {
    expect(describeCron('*/5 * * * *')).toBe('Every 5 minutes')
    expect(describeCron('0 9 * * 1-5')).toContain('09:00 AM')
  })

  it('computes ascending next runs', () => {
    const runs = nextRuns('0 0 * * *', 3)
    expect(runs).toHaveLength(3)
    expect(runs[1]!.getTime()).toBeGreaterThan(runs[0]!.getTime())
    expect(runs[2]!.getTime()).toBeGreaterThan(runs[1]!.getTime())
  })

  it('throws on an invalid expression', () => {
    expect(() => describeCron('not a cron')).toThrow()
    expect(() => nextRuns('99 99 * * *')).toThrow()
  })
})
