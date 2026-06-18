import { describe, expect, it } from 'vitest'

import { diffStats, toDiffLines } from './diff'

describe('diff', () => {
  it('marks added, removed, and context lines', () => {
    const lines = toDiffLines('a\nb\nc\n', 'a\nc\nd\n')
    expect(lines).toContainEqual({ type: 'del', text: 'b' })
    expect(lines).toContainEqual({ type: 'add', text: 'd' })
    expect(lines.some((l) => l.type === 'context' && l.text === 'a')).toBe(true)
  })

  it('counts stats', () => {
    const lines = toDiffLines('a\nb\n', 'a\nc\n')
    expect(diffStats(lines)).toEqual({ added: 1, removed: 1 })
  })

  it('is empty-diff for identical input', () => {
    const lines = toDiffLines('same\ntext', 'same\ntext')
    expect(diffStats(lines)).toEqual({ added: 0, removed: 0 })
  })
})
