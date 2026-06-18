// Coarse JSON tokenizer for read-only syntax highlighting. Classifies the output
// of a formatter (well-formed, indented JSON) into token kinds; object keys are
// split out as `property` so they color distinctly from string values.

import { createPush, type Token, type TokenKind } from './types'

const MATCHERS: Array<{ kind: TokenKind; re: RegExp }> = [
  { kind: 'plain', re: /^\s+/ },
  // Double-quoted string with backslash escapes; tolerate an unterminated tail.
  { kind: 'string', re: /^"(?:\\.|[^"\\])*"?/ },
  { kind: 'number', re: /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/ },
  { kind: 'keyword', re: /^(?:true|false|null)\b/ },
  { kind: 'punctuation', re: /^[{}[\],:]/ },
]

export function tokenizeJson(src: string): Token[] {
  const tokens: Token[] = []
  const push = createPush(tokens)
  let rest = src

  while (rest) {
    let matched = false
    for (const { kind, re } of MATCHERS) {
      const m = re.exec(rest)
      if (!m) continue
      const text = m[0]
      // A string immediately followed by ":" is an object key.
      const k = kind === 'string' && /^\s*:/.test(rest.slice(text.length)) ? 'property' : kind
      push(k, text)
      rest = rest.slice(text.length)
      matched = true
      break
    }
    if (!matched) {
      push('plain', rest[0]!)
      rest = rest.slice(1)
    }
  }

  return tokens
}
