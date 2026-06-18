import { describe, expect, it } from 'vitest'

import { convertColor } from './color'

const valueOf = (input: string, label: string) =>
  convertColor(input).formats.find((f) => f.label === label)?.value

describe('color', () => {
  it('converts a hex color across the common color spaces', () => {
    const r = convertColor('#ff0000')
    expect(r.valid).toBe(true)
    expect(valueOf('#ff0000', 'HEX')).toBe('#ff0000')
    expect(valueOf('#ff0000', 'RGB')).toBe('rgb(255, 0, 0)')
    expect(valueOf('#ff0000', 'HSL')).toBe('hsl(0, 100%, 50%)')
  })

  it('exposes the extended color spaces', () => {
    const labels = convertColor('#ff0000').formats.map((f) => f.label)
    expect(labels).toEqual(
      expect.arrayContaining(['HSV', 'HWB', 'CMYK', 'LAB', 'LCH', 'XYZ', 'Name']),
    )
    expect(valueOf('#ff0000', 'Name')).toBe('red')
  })

  it('accepts CSS color names and rgb() notation', () => {
    expect(valueOf('red', 'HEX')).toBe('#ff0000')
    expect(valueOf('rgb(0, 128, 0)', 'HEX')).toBe('#008000')
  })

  it('produces a solid swatch hex even for translucent input', () => {
    expect(convertColor('rgba(255, 0, 0, 0.5)').swatch).toBe('#ff0000')
  })

  it('flags invalid input', () => {
    expect(convertColor('not-a-color').valid).toBe(false)
  })
})
