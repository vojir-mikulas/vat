import { md5, sha1, sha256, sha512 } from 'hash-wasm'

// File checksums over raw bytes (hash-wasm). Mirrors the text Hash tool but takes
// a Uint8Array so it can digest any uploaded file.

export const CHECKSUM_ALGOS = ['md5', 'sha1', 'sha256', 'sha512'] as const
export type ChecksumAlgo = (typeof CHECKSUM_ALGOS)[number]

export const ALGO_LABELS: Record<ChecksumAlgo, string> = {
  md5: 'MD5',
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha512: 'SHA-512',
}

const FNS: Record<ChecksumAlgo, (data: Uint8Array) => Promise<string>> = {
  md5,
  sha1,
  sha256,
  sha512,
}

export function hashBytes(data: Uint8Array, algo: ChecksumAlgo): Promise<string> {
  return FNS[algo](data)
}

export async function hashAllBytes(data: Uint8Array): Promise<Record<ChecksumAlgo, string>> {
  const entries = await Promise.all(
    CHECKSUM_ALGOS.map(async (algo) => [algo, await FNS[algo](data)] as const),
  )
  return Object.fromEntries(entries) as Record<ChecksumAlgo, string>
}
