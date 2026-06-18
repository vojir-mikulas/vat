import { describe, expect, it } from 'vitest'

import { tokenizeYaml } from './yaml'
import type { TokenKind } from './types'

const kindsOf = (yaml: string, value: string): TokenKind[] =>
  tokenizeYaml(yaml)
    .filter((t) => t.value === value)
    .map((t) => t.kind)

describe('tokenizeYaml', () => {
  it('round-trips the source exactly', () => {
    const yaml = 'name: John\nage: 30\ntags:\n  - a\n  - b # note\n'
    expect(
      tokenizeYaml(yaml)
        .map((t) => t.value)
        .join(''),
    ).toBe(yaml)
  })

  it('classifies keys, comments, numbers and literals', () => {
    expect(kindsOf('name: John', 'name')).toEqual(['property'])
    expect(kindsOf('age: 30', '30')).toEqual(['number'])
    expect(kindsOf('ok: true', 'true')).toEqual(['keyword'])
    expect(kindsOf('a: 1 # hi', '# hi')).toEqual(['comment'])
  })
})
