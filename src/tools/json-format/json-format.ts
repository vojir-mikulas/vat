// JSON beautify/minify. Parsing throws SyntaxError with a descriptive message,
// which the UI surfaces directly. Indent is either a space count or a literal tab.

export type Indent = 2 | 4 | 'tab'

function indentArg(indent: Indent): number | string {
  return indent === 'tab' ? '\t' : indent
}

export function formatJson(input: string, indent: Indent = 2): string {
  return JSON.stringify(JSON.parse(input), null, indentArg(indent))
}

export function minifyJson(input: string): string {
  return JSON.stringify(JSON.parse(input))
}
