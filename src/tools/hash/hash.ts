import { md5, sha1, sha256, sha512 } from 'hash-wasm'

// Cryptographic hashes via hash-wasm (WebAssembly). MD5/SHA-1 are included for
// legacy/checksum use despite being unsuitable for security. All functions are
// async because the WASM module hashes off the synchronous path.

export const HASH_ALGOS = ['md5', 'sha1', 'sha256', 'sha512'] as const
export type HashAlgo = (typeof HASH_ALGOS)[number]

export const ALGO_LABELS: Record<HashAlgo, string> = {
  md5: 'MD5',
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha512: 'SHA-512',
}

const FNS: Record<HashAlgo, (data: string) => Promise<string>> = { md5, sha1, sha256, sha512 }

export function hashText(text: string, algo: HashAlgo): Promise<string> {
  return FNS[algo](text)
}

export async function hashAll(text: string): Promise<Record<HashAlgo, string>> {
  const entries = await Promise.all(
    HASH_ALGOS.map(async (algo) => [algo, await FNS[algo](text)] as const),
  )
  return Object.fromEntries(entries) as Record<HashAlgo, string>
}
