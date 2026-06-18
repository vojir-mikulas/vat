import { unzipSync } from 'fflate'

// Extract a ZIP archive into its file entries (directories are skipped).

export interface ArchiveEntry {
  name: string
  data: Uint8Array
}

export function extractZip(data: Uint8Array): ArchiveEntry[] {
  const out = unzipSync(data)
  return Object.entries(out)
    .filter(([name]) => !name.endsWith('/'))
    .map(([name, bytes]) => ({ name, data: bytes }))
}
