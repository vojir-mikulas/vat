// URL percent-encoding. Two encode modes: component (encodeURIComponent — escapes
// everything not allowed in a single query/path segment) and whole-URL (encodeURI
// — preserves reserved URL characters like : / ? #). Decoding is shared.

export function encodeUrl(input: string, wholeUrl = false): string {
  return wholeUrl ? encodeURI(input) : encodeURIComponent(input)
}

/** Throws on malformed percent-escapes (e.g. a lone "%"). */
export function decodeUrl(input: string): string {
  return decodeURIComponent(input)
}
