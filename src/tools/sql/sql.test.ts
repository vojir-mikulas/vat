import { describe, expect, it } from 'vitest'

import { conciseError, formatSql } from './sql'

describe('sql', () => {
  it('uppercases keywords and breaks clauses onto new lines', () => {
    const out = formatSql('select a, b from t where a = 1', 'sql')
    expect(out).toContain('SELECT')
    expect(out).toContain('FROM')
    expect(out).toContain('WHERE')
    expect(out.split('\n').length).toBeGreaterThan(1)
  })

  it('formats with a specific dialect', () => {
    expect(formatSql('select 1', 'postgresql')).toContain('SELECT')
  })
})

describe('conciseError', () => {
  it('keeps only the first line', () => {
    expect(conciseError(new Error('Parse error: bad token\nat line 3\n...lots more'))).toBe(
      'Parse error: bad token',
    )
  })

  it('truncates an overly long single line', () => {
    const msg = conciseError(new Error('x'.repeat(400)))
    expect(msg.length).toBeLessThanOrEqual(161)
    expect(msg.endsWith('…')).toBe(true)
  })
})
