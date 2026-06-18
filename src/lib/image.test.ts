import { describe, expect, it } from 'vitest'

import { aspectDimensions, formatFromMime, isLossy, replaceExtension } from './image'

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
