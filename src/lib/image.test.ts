import { describe, expect, it } from 'vitest'

import {
  aspectDimensions,
  displayDimensions,
  displayRectToSource,
  formatFromMime,
  isLossy,
  isSvg,
  replaceExtension,
  svgPixelSize,
} from './image'

describe('image helpers', () => {
  it('replaces the file extension', () => {
    expect(replaceExtension('photo.jpeg', 'png')).toBe('photo.png')
    expect(replaceExtension('archive.tar.gz', 'webp')).toBe('archive.tar.webp')
    expect(replaceExtension('noext', 'png')).toBe('noext.png')
  })

  it('derives a locked dimension from aspect ratio', () => {
    expect(aspectDimensions(800, 400, { width: 400 }, true)).toEqual({ width: 400, height: 200 })
    expect(aspectDimensions(800, 400, { height: 100 }, true)).toEqual({ width: 200, height: 100 })
  })

  it('keeps both dimensions when aspect is unlocked', () => {
    expect(aspectDimensions(800, 400, { width: 300, height: 300 }, false)).toEqual({
      width: 300,
      height: 300,
    })
  })

  it('falls back to natural size when no target given', () => {
    expect(aspectDimensions(640, 480, {}, true)).toEqual({ width: 640, height: 480 })
  })

  it('knows which formats are lossy', () => {
    expect(isLossy('png')).toBe(false)
    expect(isLossy('jpeg')).toBe(true)
    expect(isLossy('webp')).toBe(true)
  })

  it('maps mime types to formats', () => {
    expect(formatFromMime('image/jpeg')).toBe('jpeg')
    expect(formatFromMime('image/webp')).toBe('webp')
    expect(formatFromMime('image/gif')).toBe('png')
  })
})

describe('display rotation mapping', () => {
  it('swaps dimensions for quarter turns only', () => {
    expect(displayDimensions(100, 40, 0)).toEqual({ width: 100, height: 40 })
    expect(displayDimensions(100, 40, 90)).toEqual({ width: 40, height: 100 })
    expect(displayDimensions(100, 40, 180)).toEqual({ width: 100, height: 40 })
    expect(displayDimensions(100, 40, 270)).toEqual({ width: 40, height: 100 })
  })

  it('maps a full display rect back to the full source', () => {
    expect(
      displayRectToSource({ x: 0, y: 0, width: 40, height: 100 }, 100, 40, 90, false, false),
    ).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 40,
    })
  })

  it('is the identity with no transform', () => {
    expect(
      displayRectToSource({ x: 10, y: 5, width: 30, height: 20 }, 100, 40, 0, false, false),
    ).toEqual({
      x: 10,
      y: 5,
      width: 30,
      height: 20,
    })
  })

  it('maps the top of a 90° view to the left of the source', () => {
    // Display is 40×100 (source 100×40 turned a quarter clockwise). The top strip
    // of the display comes from the left edge of the source.
    expect(
      displayRectToSource({ x: 0, y: 0, width: 40, height: 50 }, 100, 40, 90, false, false),
    ).toEqual({
      x: 0,
      y: 0,
      width: 50,
      height: 40,
    })
  })

  it('mirrors horizontally: left of the display maps to the right of the source', () => {
    expect(
      displayRectToSource({ x: 0, y: 0, width: 30, height: 40 }, 100, 40, 0, true, false),
    ).toEqual({
      x: 70,
      y: 0,
      width: 30,
      height: 40,
    })
  })
})

describe('svg handling', () => {
  it('recognizes SVG files by type or extension', () => {
    expect(isSvg(new File([], 'logo.svg', { type: 'image/svg+xml' }))).toBe(true)
    expect(isSvg(new File([], 'LOGO.SVG', { type: '' }))).toBe(true)
    expect(isSvg(new File([], 'photo.png', { type: 'image/png' }))).toBe(false)
  })

  it('reads pixel size from width/height attributes', () => {
    expect(svgPixelSize('<svg width="200" height="120"></svg>')).toEqual({
      width: 200,
      height: 120,
    })
    expect(svgPixelSize('<svg width="48px" height="48px"></svg>')).toEqual({
      width: 48,
      height: 48,
    })
  })

  it('falls back to the viewBox, ignoring percentage sizes', () => {
    expect(svgPixelSize('<svg width="100%" height="100%" viewBox="0 0 64 32"></svg>')).toEqual({
      width: 64,
      height: 32,
    })
  })

  it('uses the default when no usable size is present', () => {
    expect(svgPixelSize('<svg></svg>', 256)).toEqual({ width: 256, height: 256 })
  })
})
