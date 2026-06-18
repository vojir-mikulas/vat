import { describe, expect, it } from 'vitest'

import { formatJson, minifyJson } from './json-format'

describe('json-format', () => {
  it('beautifies with the given indent', () => {
    expect(formatJson('{"a":1,"b":[2,3]}', 2)).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}')
    expect(formatJson('{"a":1}', 'tab')).toBe('{\n\t"a": 1\n}')
  })

  it('minifies', () => {
    expect(minifyJson('{\n  "a": 1,\n  "b": 2\n}')).toBe('{"a":1,"b":2}')
  })

  it('throws on invalid JSON', () => {
    expect(() => formatJson('{a:1}')).toThrow()
    expect(() => minifyJson('nope')).toThrow()
  })
})
