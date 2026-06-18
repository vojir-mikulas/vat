import { describe, expect, it } from 'vitest'

import { decodeHtml, encodeHtml } from './html-entities'

describe('html-entities', () => {
  it('encodes the unsafe characters', () => {
    expect(encodeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    )
  })

  it('decodes named, decimal, and hex entities', () => {
    expect(decodeHtml('&lt;b&gt;&amp;copy&#39;&#x2764;')).toBe(`<b>&copy'❤`)
  })

  it('round-trips', () => {
    const s = `if (a < b && c > "d") return 'e';`
    expect(decodeHtml(encodeHtml(s))).toBe(s)
  })
})
