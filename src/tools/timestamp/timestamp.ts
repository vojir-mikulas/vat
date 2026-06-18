// Unix ↔ human timestamp conversion. Accepts a Unix timestamp (auto-detecting
// seconds vs milliseconds by digit length) or any Date-parseable string, and
// renders it in several formats.

export interface TimeParts {
  unixS: string
  unixMs: string
  iso: string
  utc: string
  local: string
  relative: string
}

export function parseTimestamp(input: string): Date | null {
  const s = input.trim()
  if (!s) return null
  if (/^-?\d+$/.test(s)) {
    const n = Number(s)
    // > 11 digits ⇒ already milliseconds; otherwise seconds.
    const ms = s.replace('-', '').length > 11 ? n : n * 1000
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const ms = Date.parse(s)
  return Number.isNaN(ms) ? null : new Date(ms)
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

export function relativeTime(target: number, now: number = Date.now()): string {
  const diffSec = Math.round((target - now) / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, secs] of UNITS) {
    if (abs >= secs || unit === 'second') {
      return rtf.format(Math.round(diffSec / secs), unit)
    }
  }
  return rtf.format(0, 'second')
}

export function formatParts(d: Date, now: number = Date.now()): TimeParts {
  return {
    unixS: String(Math.floor(d.getTime() / 1000)),
    unixMs: String(d.getTime()),
    iso: d.toISOString(),
    utc: d.toUTCString(),
    local: d.toLocaleString(),
    relative: relativeTime(d.getTime(), now),
  }
}
