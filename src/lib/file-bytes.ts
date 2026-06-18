import { downloadBlob } from '@/lib/download'

// Read a File's contents as bytes.
export async function readFileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer())
}

// Trigger a download for a byte array.
export function downloadBytes(
  data: Uint8Array,
  filename: string,
  mime = 'application/octet-stream',
) {
  downloadBlob(new Blob([data as BlobPart], { type: mime }), filename)
}
