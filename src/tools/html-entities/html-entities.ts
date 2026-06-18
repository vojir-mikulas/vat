// HTML entity encode/decode. Encoding escapes the five characters that are unsafe
// in HTML text/attribute context. Decoding delegates to the browser's own parser
// (via a detached <textarea>) so it resolves named, decimal, and hex entities.

const ENCODE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function encodeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ENCODE_MAP[c] ?? c)
}

export function decodeHtml(input: string): string {
  const el = document.createElement('textarea')
  el.innerHTML = input
  return el.value
}
