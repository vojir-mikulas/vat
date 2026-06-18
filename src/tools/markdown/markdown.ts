import DOMPurify from 'dompurify'
import { marked } from 'marked'

// Render Markdown to HTML, then sanitize. marked produces the HTML (with GitHub-
// flavored line breaks); DOMPurify strips anything dangerous (scripts, event
// handlers, javascript: URLs) so the result is safe to inject as innerHTML.
export function renderMarkdown(input: string): string {
  const html = marked.parse(input, { async: false, gfm: true, breaks: true }) as string
  return DOMPurify.sanitize(html)
}
