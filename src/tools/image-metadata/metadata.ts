// Helpers to render an exifr metadata object as a flat, displayable key/value
// list. Pure (no DOM), so they're unit-tested; the actual parsing happens in the
// component via exifr.

export function formatMetaValue(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toLocaleString()
  if (Array.isArray(value)) return value.map(formatMetaValue).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export interface MetaEntry {
  key: string
  value: string
}

export function flattenMetadata(obj: Record<string, unknown> | undefined | null): MetaEntry[] {
  if (!obj) return []
  return Object.entries(obj)
    .map(([key, v]) => ({ key, value: formatMetaValue(v) }))
    .filter((e) => e.value !== '')
}
