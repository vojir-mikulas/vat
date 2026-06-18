// Parse an otpauth:// URI (the format behind authenticator QR codes) into its
// fields. Pure and fully testable. Reference:
// https://github.com/google/google-authenticator/wiki/Key-Uri-Format

export interface OtpInfo {
  type: 'totp' | 'hotp'
  label: string
  issuer?: string
  account: string
  secret: string
  algorithm: string
  digits: number
  /** TOTP only — the step in seconds. */
  period?: number
  /** HOTP only — the initial counter. */
  counter?: number
}

export function parseOtpUri(uri: string): OtpInfo {
  let url: URL
  try {
    url = new URL(uri.trim())
  } catch {
    throw new Error('Not a valid URI')
  }
  if (url.protocol !== 'otpauth:') throw new Error('Must start with otpauth://')

  const type = url.hostname.toLowerCase()
  if (type !== 'totp' && type !== 'hotp') throw new Error('Type must be totp or hotp')

  const label = decodeURIComponent(url.pathname.replace(/^\//, ''))
  const params = url.searchParams

  // The label is "[issuer:]account"; the explicit issuer param takes precedence.
  let issuer = params.get('issuer') ?? undefined
  let account = label
  const sep = label.indexOf(':')
  if (sep !== -1) {
    if (!issuer) issuer = label.slice(0, sep).trim()
    account = label.slice(sep + 1).trim()
  }

  const secret = params.get('secret')
  if (!secret) throw new Error('Missing required "secret" parameter')

  return {
    type,
    label,
    issuer,
    account,
    secret,
    algorithm: (params.get('algorithm') ?? 'SHA1').toUpperCase(),
    digits: Number(params.get('digits') ?? '6'),
    period: type === 'totp' ? Number(params.get('period') ?? '30') : undefined,
    counter: type === 'hotp' ? Number(params.get('counter') ?? '0') : undefined,
  }
}
