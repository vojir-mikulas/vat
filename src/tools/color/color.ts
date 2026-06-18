import { colord, extend } from 'colord'
import cmykPlugin from 'colord/plugins/cmyk'
import hwbPlugin from 'colord/plugins/hwb'
import labPlugin from 'colord/plugins/lab'
import lchPlugin from 'colord/plugins/lch'
import namesPlugin from 'colord/plugins/names'
import xyzPlugin from 'colord/plugins/xyz'

// Parse a color in any common notation (hex, rgb(), hsl(), or a CSS name) and
// render it in every color space colord can reach. Each plugin adds one more
// model: names (keywords), CMYK, HWB, CIELAB, CIELCH and CIE XYZ.
extend([namesPlugin, cmykPlugin, hwbPlugin, labPlugin, lchPlugin, xyzPlugin])

export interface ColorFormat {
  label: string
  value: string
}

export interface ColorResult {
  valid: boolean
  /** Solid hex (no alpha) for the preview swatch; empty when invalid. */
  swatch: string
  formats: ColorFormat[]
}

const INVALID: ColorResult = { valid: false, swatch: '', formats: [] }

// Round to `d` decimals and drop trailing zeros — keeps the numeric color spaces
// (LAB/LCH/XYZ) readable without pretending to a precision they don't have.
const n = (x: number, d = 0) => String(Math.round(x * 10 ** d) / 10 ** d)

export function convertColor(input: string): ColorResult {
  const c = colord(input.trim())
  if (!c.isValid()) return INVALID

  const hsv = c.toHsv()
  const lab = c.toLab()
  const xyz = c.toXyz()
  const name = c.toName({ closest: false })

  const formats: ColorFormat[] = [
    { label: 'HEX', value: c.toHex() },
    { label: 'RGB', value: c.toRgbString() },
    { label: 'HSL', value: c.toHslString() },
    { label: 'HSV', value: `hsv(${n(hsv.h)}, ${n(hsv.s)}%, ${n(hsv.v)}%)` },
    { label: 'HWB', value: c.toHwbString() },
    { label: 'CMYK', value: c.toCmykString() },
    { label: 'LAB', value: `lab(${n(lab.l, 2)}% ${n(lab.a, 2)} ${n(lab.b, 2)})` },
    { label: 'LCH', value: c.toLchString() },
    { label: 'XYZ', value: `xyz(${n(xyz.x, 2)}, ${n(xyz.y, 2)}, ${n(xyz.z, 2)})` },
  ]
  if (name) formats.push({ label: 'Name', value: name })

  return { valid: true, swatch: c.alpha(1).toHex(), formats }
}
