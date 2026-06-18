// Coarse YAML tokenizer for read-only syntax highlighting. Classifies comments,
// quoted/bare scalars, numbers and structural punctuation; mapping keys (a word
// or quoted string before ":") are split out as `property`.

import { createPush, type Token, type TokenKind } from './types'

const BOOLISH = new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off', '~'])

const MATCHERS: Array<{ kind: TokenKind; re: RegExp }> = [
  { kind: 'plain', re: /^[ \t\n]+/ },
  { kind: 'comment', re: /^#[^\n]*/ },
  { kind: 'string', re: /^'(?:[^']|'')*'?/ },
  { kind: 'string', re: /^"(?:\\.|[^"\\])*"?/ },
  // Numbers before "-" punctuation so negatives stay one token.
  { kind: 'number', re: /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/ },
  { kind: 'punctuation', re: /^[-:[\]{},|>&*]/ },
  // Bare scalar / word — classified as keyword/property/plain below.
  { kind: 'plain', re: /^[^\s#:'",[\]{}|>&*-][^\s#:'",[\]{}]*/ },
]

export function tokenizeYaml(src: string): Token[] {
  const tokens: Token[] = []
  const push = createPush(tokens)
  let rest = src

  while (rest) {
    let matched = false
    for (const { kind, re } of MATCHERS) {
      const m = re.exec(rest)
      if (!m) continue
      const text = m[0]
      let k = kind
      // A word or quoted string followed by ":" (then space/EOL) is a mapping key.
      const isKey = /^:(?:\s|$)/.test(rest.slice(text.length))
      if ((kind === 'plain' || kind === 'string') && /[^\s]/.test(text)) {
        if (isKey) k = 'property'
        else if (kind === 'plain' && BOOLISH.has(text.toLowerCase())) k = 'keyword'
      }
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
