// Regex tester. Builds a RegExp from a pattern + flags (throwing on an invalid
// pattern, surfaced by the UI). With the global/sticky flag it returns every
// match; otherwise just the first — matching native RegExp semantics.

export interface RegexMatch {
  match: string
  index: number
  groups: (string | undefined)[]
  namedGroups: Record<string, string | undefined>
}

export const REGEX_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const
export type RegexFlag = (typeof REGEX_FLAGS)[number]

function toMatch(m: RegExpMatchArray): RegexMatch {
  return {
    match: m[0],
    index: m.index ?? 0,
    groups: m.slice(1),
    namedGroups: m.groups ? { ...m.groups } : {},
  }
}

export function runRegex(pattern: string, flags: string, text: string): RegexMatch[] {
  const re = new RegExp(pattern, flags)
  if (!pattern) return []
  const matches: RegexMatch[] = []
  if (re.global) {
    for (const m of text.matchAll(re)) matches.push(toMatch(m))
  } else {
    const m = re.exec(text)
    if (m) matches.push(toMatch(m))
  }
  return matches
}
