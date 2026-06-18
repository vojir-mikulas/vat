// Cryptographically-random password generator. Uses crypto.getRandomValues with
// rejection sampling for an unbiased index, guarantees at least one character
// from each selected set, then shuffles so the guaranteed characters aren't
// clustered at the front.

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/',
} as const

export type CharSet = keyof typeof SETS

export interface PasswordOptions {
  length: number
  lower: boolean
  upper: boolean
  digits: boolean
  symbols: boolean
}

function randomInt(max: number): number {
  const arr = new Uint32Array(1)
  // Reject the top partial bucket so the modulo is uniform.
  const limit = Math.floor(0xffffffff / max) * max
  let x: number
  do {
    crypto.getRandomValues(arr)
    x = arr[0]!
  } while (x >= limit)
  return x % max
}

function selectedSets(opts: PasswordOptions): string[] {
  return (Object.keys(SETS) as CharSet[]).filter((k) => opts[k]).map((k) => SETS[k])
}

export function generatePassword(opts: PasswordOptions): string {
  const sets = selectedSets(opts)
  if (sets.length === 0) return ''
  const length = Math.max(1, Math.min(256, Math.floor(opts.length) || 1))
  const pool = sets.join('')

  const chars: string[] = []
  for (const set of sets) chars.push(set[randomInt(set.length)]!)
  while (chars.length < length) chars.push(pool[randomInt(pool.length)]!)
  chars.length = length

  // Fisher-Yates shuffle.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join('')
}

/** Rough entropy estimate in bits: length × log2(pool size). */
export function entropyBits(opts: PasswordOptions): number {
  const poolSize = selectedSets(opts).reduce((sum, s) => sum + s.length, 0)
  if (poolSize === 0) return 0
  return Math.round(Math.max(1, Math.floor(opts.length)) * Math.log2(poolSize))
}
