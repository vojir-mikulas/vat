import { describe, expect, it } from 'vitest'

import { formatSql } from './sql'

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
