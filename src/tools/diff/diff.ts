import { diffLines, type Change } from 'diff'

// Line-by-line diff between two texts, plus a renderable flat line list and
// add/remove stats. Pure wrappers around jsdiff so the UI stays declarative.

export type DiffLineType = 'add' | 'del' | 'context'

export interface DiffLine {
  type: DiffLineType
  text: string
}

export function lineDiff(original: string, changed: string): Change[] {
  return diffLines(original, changed)
}

export function toDiffLines(original: string, changed: string): DiffLine[] {
  const out: DiffLine[] = []
  for (const part of lineDiff(original, changed)) {
    const type: DiffLineType = part.added ? 'add' : part.removed ? 'del' : 'context'
    const segments = part.value.split('\n')
    // A trailing newline yields an empty final segment — drop it so we don't emit
    // a phantom blank line per hunk.
    if (segments.at(-1) === '') segments.pop()
    for (const text of segments) out.push({ type, text })
  }
  return out
}

export function diffStats(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const l of lines) {
    if (l.type === 'add') added++
    else if (l.type === 'del') removed++
  }
  return { added, removed }
}
