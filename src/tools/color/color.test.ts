import { describe, expect, it } from 'vitest'

import { convertColor } from './color'

describe('color', () => {
  it('converts a hex color to rgb and hsl', () => {
    const r = convertColor('#ff0000')
    expect(r.valid).toBe(true)
    expect(r.hex).toBe('#ff0000')
    expect(r.rgb).toBe('rgb(255, 0, 0)')
    expect(r.hsl).toBe('hsl(0, 100%, 50%)')
  })

  it('accepts CSS color names and rgb() notation', () => {
    expect(convertColor('red').hex).toBe('#ff0000')
    expect(convertColor('rgb(0, 128, 0)').hex).toBe('#008000')
  })

  it('flags invalid input', () => {
    expect(convertColor('not-a-color').valid).toBe(false)
  })
})
