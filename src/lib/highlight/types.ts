// Coarse token kinds shared by every language tokenizer. They aren't a full
// grammar — just enough classification to color read-only output the way a
// Shiki/TextMate theme would, mapped to the app's `--syntax-*` OKLCH variables.

export type TokenKind =
  | 'keyword'
  | 'function'
  | 'property'
  | 'string'
  | 'number'
  | 'comment'
  | 'operator'
  | 'punctuation'
  | 'plain'

export interface Token {
  kind: TokenKind
  value: string
}

// Returns a `push` that appends to `tokens`, coalescing adjacent same-kind runs
// (e.g. whitespace/plain) so the rendered span count stays low.
export function createPush(tokens: Token[]) {
  return (kind: TokenKind, value: string) => {
    if (!value) return
    const last = tokens[tokens.length - 1]
    if (last && last.kind === kind) last.value += value
    else tokens.push({ kind, value })
  }
}
