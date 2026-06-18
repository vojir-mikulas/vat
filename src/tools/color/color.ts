import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'

// Parse a color in any common notation (hex, rgb(), hsl(), or a CSS name) and
// render it as HEX, RGB, and HSL. The names plugin adds keyword support ("red").
extend([namesPlugin])

export interface ColorResult {
  valid: boolean
  hex: string
  rgb: string
  hsl: string
}

const INVALID: ColorResult = { valid: false, hex: '', rgb: '', hsl: '' }

export function convertColor(input: string): ColorResult {
  const c = colord(input.trim())
  if (!c.isValid()) return INVALID
  return { valid: true, hex: c.toHex(), rgb: c.toRgbString(), hsl: c.toHslString() }
}
