import { describe, expect, it } from 'vitest'

import { jsonToYaml, yamlToJson } from './json-yaml'

describe('json-yaml', () => {
  it('converts JSON to YAML', () => {
    expect(jsonToYaml('{"name":"vat","tags":["a","b"]}')).toBe('name: vat\ntags:\n  - a\n  - b\n')
  })

  it('converts YAML to JSON', () => {
    expect(yamlToJson('name: vat\ntags:\n  - a\n  - b\n')).toBe(
      '{\n  "name": "vat",\n  "tags": [\n    "a",\n    "b"\n  ]\n}',
    )
  })

  it('round-trips structure', () => {
    const json = '{"a":1,"b":{"c":true,"d":null}}'
    expect(yamlToJson(jsonToYaml(json))).toBe(JSON.stringify(JSON.parse(json), null, 2))
  })

  it('throws on invalid input', () => {
    expect(() => jsonToYaml('{bad}')).toThrow()
    expect(() => yamlToJson('a:\n  - b\n - c')).toThrow()
  })
})
