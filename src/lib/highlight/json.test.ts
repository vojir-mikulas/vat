import { describe, expect, it } from 'vitest'

import { tokenizeJson } from './json'
import type { TokenKind } from './types'

const kindsOf = (json: string, value: string): TokenKind[] =>
  tokenizeJson(json)
    .filter((t) => t.value === value)
    .map((t) => t.kind)

describe('tokenizeJson', () => {
  it('round-trips the source exactly', () => {
    const json = '{\n  "id": 1,\n  "ok": true,\n  "tags": ["a", null]\n}'
    expect(
      tokenizeJson(json)
        .map((t) => t.value)
        .join(''),
    ).toBe(json)
  })

  it('splits keys from string values', () => {
    expect(kindsOf('{"name": "John"}', '"name"')).toEqual(['property'])
    expect(kindsOf('{"name": "John"}', '"John"')).toEqual(['string'])
  })

  it('classifies numbers and literals', () => {
    expect(kindsOf('{"n": -2.5e3}', '-2.5e3')).toEqual(['number'])
    expect(kindsOf('{"a": true, "b": null}', 'true')).toEqual(['keyword'])
    expect(kindsOf('{"a": true, "b": null}', 'null')).toEqual(['keyword'])
  })
})
