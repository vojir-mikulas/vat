// Base64 encode/decode, UTF-8 safe (btoa/atob only handle Latin-1, so we route
// bytes through TextEncoder/TextDecoder). Decoding is tolerant: it accepts both
// standard and URL-safe alphabets and missing padding.

function bytesToBinary(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return bin
}

export function encodeBase64(input: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(input)
  let out = btoa(bytesToBinary(bytes))
  if (urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return out
}

/** Throws if the input is not valid Base64. */
export function decodeBase64(input: string): string {
  // Normalize URL-safe alphabet and whitespace, then restore padding.
  let s = input.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad === 1) throw new Error('Invalid Base64 length')
  if (pad) s += '='.repeat(4 - pad)
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error('Invalid Base64 characters')

  const bin = atob(s)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}
