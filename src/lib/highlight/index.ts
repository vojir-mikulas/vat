// Shared lightweight syntax highlighting. A coarse per-language tokenizer feeds
// `<span>`s colored via the `--syntax-*` OKLCH theme variables (see index.css) —
// a Shiki-style look without the runtime/bundle cost of a full grammar engine.

import { tokenizeJson } from './json'
import { tokenizeSql } from './sql'
import { tokenizeYaml } from './yaml'
import type { Token, TokenKind } from './types'

export type { Token, TokenKind } from './types'

export type Language = 'sql' | 'json' | 'yaml'

const TOKENIZERS: Record<Language, (code: string) => Token[]> = {
  sql: tokenizeSql,
  json: tokenizeJson,
  yaml: tokenizeYaml,
}

export function tokenize(code: string, language: Language): Token[] {
  return TOKENIZERS[language](code)
}

// Tailwind classes per token kind, pointing at the shared `--syntax-*` variables.
export const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: 'text-[var(--syntax-keyword)] font-medium',
  function: 'text-[var(--syntax-function)]',
  property: 'text-[var(--syntax-property)]',
  string: 'text-[var(--syntax-string)]',
  number: 'text-[var(--syntax-number)]',
  comment: 'text-[var(--syntax-comment)] italic',
  operator: 'text-[var(--syntax-operator)]',
  punctuation: 'text-[var(--syntax-punctuation)]',
  plain: '',
}
