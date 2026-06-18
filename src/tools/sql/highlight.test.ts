import { describe, expect, it } from 'vitest'

import { tokenizeSql, type TokenKind } from './highlight'

const kindsOf = (sql: string, value: string): TokenKind[] =>
  tokenizeSql(sql)
    .filter((t) => t.value === value)
    .map((t) => t.kind)

describe('tokenizeSql', () => {
  it('round-trips the source exactly', () => {
    const sql = 'SELECT id, name -- note\nFROM users WHERE id = 1;'
    expect(
      tokenizeSql(sql)
        .map((t) => t.value)
        .join(''),
    ).toBe(sql)
  })

  it('classifies keywords, strings, numbers and comments', () => {
    expect(kindsOf('SELECT 1', 'SELECT')).toEqual(['keyword'])
    expect(kindsOf("WHERE x = 'a'", "'a'")).toEqual(['string'])
    expect(kindsOf('LIMIT 42', '42')).toEqual(['number'])
    expect(kindsOf('-- hi\nSELECT 1', '-- hi')).toEqual(['comment'])
  })

  it('treats a word before a paren as a function', () => {
    expect(kindsOf('SELECT count(*)', 'count')).toEqual(['function'])
  })

  it('does not stall on stray characters', () => {
    expect(
      tokenizeSql('@#')
        .map((t) => t.value)
        .join(''),
    ).toBe('@#')
  })
})
