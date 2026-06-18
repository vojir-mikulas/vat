import { describe, expect, it } from 'vitest'

import { formatBytes } from './download'

describe('formatBytes', () => {
  it('formats bytes, KB, MB, GB', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1048576)).toBe('1 MB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB')
    expect(formatBytes(1073741824)).toBe('1 GB')
  })
})
