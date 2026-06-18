import { describe, expect, it } from 'vitest'

import { generateLorem } from './lorem'

describe('lorem', () => {
  it('generates the requested number of words', () => {
    expect(generateLorem(7, 'words').split(' ')).toHaveLength(7)
  })

  it('generates the requested number of paragraphs', () => {
    expect(generateLorem(3, 'paragraphs').split('\n\n')).toHaveLength(3)
  })

  it('generates the requested number of sentences', () => {
    const sentences = generateLorem(4, 'sentences').match(/[^.]+\./g)
    expect(sentences).toHaveLength(4)
  })

  it('starts with the canonical opening when requested', () => {
    expect(generateLorem(5, 'words', true).toLowerCase()).toMatch(/^lorem ipsum dolor/)
    expect(generateLorem(2, 'paragraphs', true)).toMatch(/^Lorem ipsum dolor/)
  })

  it('clamps to at least one unit', () => {
    expect(generateLorem(0, 'words').length).toBeGreaterThan(0)
  })
})
