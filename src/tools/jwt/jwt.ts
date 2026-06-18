// JWT decoder — splits a token and base64url-decodes the header and payload. This
// does NOT verify the signature (that needs the signing key); it's a read-only
// inspector, so the signature is returned as its raw base64url segment.

function base64UrlDecode(segment: string): string {
  let s = segment.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad === 1) throw new Error('Invalid base64url segment')
  if (pad) s += '='.repeat(4 - pad)
  const bin = atob(s)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export interface DecodedJwt {
  header: unknown
  payload: unknown
  signature: string
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.')
  if (parts.length !== 3 || parts.some((p) => p === '')) {
    throw new Error('A JWT has three non-empty dot-separated parts')
  }
  const [h, p, signature] = parts as [string, string, string]
  let header: unknown
  let payload: unknown
  try {
    header = JSON.parse(base64UrlDecode(h))
  } catch {
    throw new Error('Header is not valid base64url JSON')
  }
  try {
    payload = JSON.parse(base64UrlDecode(p))
  } catch {
    throw new Error('Payload is not valid base64url JSON')
  }
  return { header, payload, signature }
}

export interface JwtClaimDate {
  /** Registered claim name: iat | exp | nbf. */
  claim: string
  date: Date
  /** True when an `exp` claim is in the past. */
  expired?: boolean
}

// Extracts the registered time claims (iat/exp/nbf) from a payload as Dates, for
// human-readable display. `now` is injectable for testing.
export function readClaimDates(payload: unknown, now: number = Date.now()): JwtClaimDate[] {
  if (typeof payload !== 'object' || payload === null) return []
  const obj = payload as Record<string, unknown>
  const out: JwtClaimDate[] = []
  for (const claim of ['iat', 'nbf', 'exp'] as const) {
    const v = obj[claim]
    if (typeof v === 'number' && Number.isFinite(v)) {
      out.push({
        claim,
        date: new Date(v * 1000),
        ...(claim === 'exp' ? { expired: v * 1000 < now } : {}),
      })
    }
  }
  return out
}
