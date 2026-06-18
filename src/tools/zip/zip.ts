import { zipSync } from 'fflate'

// Build a ZIP archive from a set of named byte arrays (fflate, synchronous).

export interface ZipInput {
  name: string
  data: Uint8Array
}

export function createZip(inputs: ZipInput[]): Uint8Array {
  const files: Record<string, Uint8Array> = {}
  for (const { name, data } of inputs) files[name] = data
  return zipSync(files)
}
