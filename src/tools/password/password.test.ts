import { describe, expect, it } from 'vitest'

import { entropyBits, generatePassword } from './password'

const base = { length: 20, lower: false, upper: false, digits: false, symbols: false }

describe('password', () => {
  it('respects the requested length', () => {
    expect(generatePassword({ ...base, lower: true }).length).toBe(20)
  })

  it('only uses the selected character sets', () => {
    expect(generatePassword({ ...base, lower: true })).toMatch(/^[a-z]+$/)
    expect(generatePassword({ ...base, digits: true })).toMatch(/^[0-9]+$/)
  })

  it('includes at least one of each selected set', () => {
    const pw = generatePassword({
      length: 8,
      lower: true,
      upper: true,
      digits: true,
      symbols: true,
    })
    expect(pw).toMatch(/[a-z]/)
    expect(pw).toMatch(/[A-Z]/)
    expect(pw).toMatch(/[0-9]/)
  })

  it('returns empty when no set is selected', () => {
    expect(generatePassword(base)).toBe('')
    expect(entropyBits(base)).toBe(0)
  })

  it('estimates entropy', () => {
    expect(entropyBits({ ...base, lower: true })).toBeGreaterThan(0)
  })
})
