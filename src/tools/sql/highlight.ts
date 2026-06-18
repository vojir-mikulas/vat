// A small, dependency-free SQL tokenizer for read-only syntax highlighting.
// It isn't a parser — it classifies runs of text into coarse token kinds good
// enough to color formatted output, the way a Shiki/TextMate grammar would.

export type TokenKind =
  | 'keyword'
  | 'function'
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

// Common SQL reserved words across the dialects sql-formatter supports. Matched
// case-insensitively; the formatter upper-cases them but hand-typed input may not.
const KEYWORDS = new Set(
  (
    'add all alter and any as asc auto_increment begin between by case cast check column ' +
    'commit constraint create cross current_date current_time current_timestamp database ' +
    'default delete desc distinct drop else end except exists explain false foreign from ' +
    'full function grant group having if ilike in index inner insert intersect into is join ' +
    'key left like limit not null offset on or order outer over partition primary procedure ' +
    'references rename replace return returning revoke right rollback row rows select set ' +
    'show some table then to top transaction trigger true truncate union unique update using ' +
    'values view when where window with as'
  ).split(' '),
)

// Built-in / SQL data types, colored like keywords.
const TYPES = new Set(
  (
    'bigint binary bit blob bool boolean char clob date datetime decimal double enum float ' +
    'int integer interval json jsonb money nchar numeric nvarchar real serial smallint text ' +
    'time timestamp tinyint uuid varbinary varchar'
  ).split(' '),
)

// Ordered matchers: each tries to consume a token from the start of `rest`.
// The first to return a value wins, so order encodes precedence.
const MATCHERS: Array<{ kind: TokenKind; re: RegExp }> = [
  { kind: 'comment', re: /^--[^\n]*/ },
  { kind: 'comment', re: /^\/\*[\s\S]*?(?:\*\/|$)/ },
  // Single/double-quoted strings (with doubled-quote escapes) and backtick idents.
  { kind: 'string', re: /^'(?:[^']|'')*'?/ },
  { kind: 'string', re: /^"(?:[^"]|"")*"?/ },
  { kind: 'string', re: /^`(?:[^`]|``)*`?/ },
  { kind: 'number', re: /^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/ },
  // Identifier/word — classified as keyword/type/function/plain below.
  { kind: 'plain', re: /^[A-Za-z_$][\w$]*/ },
  { kind: 'operator', re: /^(?:<=|>=|<>|!=|\|\||::|[-+*/%=<>!|&^~])/ },
  { kind: 'punctuation', re: /^[(),;.[\]{}]/ },
  { kind: 'plain', re: /^\s+/ },
]

export function tokenizeSql(sql: string): Token[] {
  const tokens: Token[] = []
  let rest = sql

  const push = (kind: TokenKind, value: string) => {
    // Coalesce adjacent same-kind tokens (e.g. runs of whitespace/plain) so the
    // rendered span count stays low.
    const last = tokens[tokens.length - 1]
    if (last && last.kind === kind) last.value += value
    else tokens.push({ kind, value })
  }

  while (rest) {
    let matched = false
    for (const { kind, re } of MATCHERS) {
      const m = re.exec(rest)
      if (!m) continue
      const text = m[0]
      let k = kind
      if (kind === 'plain' && /^[A-Za-z_$]/.test(text)) {
        const lower = text.toLowerCase()
        if (KEYWORDS.has(lower) || TYPES.has(lower)) k = 'keyword'
        // A word directly followed by "(" reads as a function call.
        else if (/^\s*\(/.test(rest.slice(text.length))) k = 'function'
      }
      push(k, text)
      rest = rest.slice(text.length)
      matched = true
      break
    }
    // Safety net: consume one char so unknown bytes can't stall the loop.
    if (!matched) {
      push('plain', rest[0]!)
      rest = rest.slice(1)
    }
  }

  return tokens
}
