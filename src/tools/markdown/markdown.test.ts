import { describe, expect, it } from 'vitest'

import { renderMarkdown } from './markdown'

describe('markdown', () => {
  it('renders headings, emphasis, and links', () => {
    const html = renderMarkdown('# Title\n\nSome **bold** and a [link](https://x.io).')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('href="https://x.io"')
  })

  it('renders code and lists', () => {
    const html = renderMarkdown('- one\n- two\n\n`code`')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<code>code</code>')
  })

  it('sanitizes dangerous HTML', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)"> <script>alert(2)</script>')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('<script>')
  })
})
