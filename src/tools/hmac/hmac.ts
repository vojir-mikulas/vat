import { createHMAC, createSHA1, createSHA256, createSHA512 } from 'hash-wasm'

// HMAC (keyed hash) via hash-wasm. Returns a hex digest for the chosen SHA family.

export const HMAC_ALGOS = ['sha1', 'sha256', 'sha512'] as const
export type HmacAlgo = (typeof HMAC_ALGOS)[number]

export const HMAC_LABELS: Record<HmacAlgo, string> = {
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha512: 'SHA-512',
}

const HASHERS = { sha1: createSHA1, sha256: createSHA256, sha512: createSHA512 } as const

export async function hmac(message: string, key: string, algo: HmacAlgo): Promise<string> {
  const hasher = await createHMAC(HASHERS[algo](), key)
  hasher.init()
  hasher.update(message)
  return hasher.digest('hex')
}
