import { NIL, v1, v4, v6, v7 } from 'uuid'

// UUID generator. v4 (random) is the common default; v1/v6 are time-based, v7 is
// the sortable time-ordered draft, and NIL is the all-zero UUID.

export type UuidVersion = 'v1' | 'v4' | 'v6' | 'v7' | 'nil'

const GENERATORS: Record<UuidVersion, () => string> = {
  v1: () => v1(),
  v4: () => v4(),
  v6: () => v6(),
  v7: () => v7(),
  nil: () => NIL,
}

export function generateUuids(version: UuidVersion, count: number): string[] {
  const n = Math.max(1, Math.min(1000, Math.floor(count) || 1))
  const gen = GENERATORS[version]
  return Array.from({ length: n }, () => gen())
}
