import yaml from 'js-yaml'

// Convert between JSON and YAML. Both directions parse the source (throwing on
// malformed input, surfaced by the UI) and re-serialize. lineWidth:-1 keeps YAML
// scalars on one line instead of folding long strings.

export function jsonToYaml(input: string): string {
  const value = JSON.parse(input)
  return yaml.dump(value, { indent: 2, lineWidth: -1 })
}

export function yamlToJson(input: string, indent = 2): string {
  const value = yaml.load(input)
  return JSON.stringify(value, null, indent)
}
