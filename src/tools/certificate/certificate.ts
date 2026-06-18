// @peculiar/x509 pulls in tsyringe, which requires this polyfill. Importing it
// here (the lazy-loaded cert module) keeps it out of the base bundle. Must come
// before the @peculiar/x509 import so the metadata reflection is installed first.
import 'reflect-metadata'
import { SubjectAlternativeNameExtension, X509Certificate } from '@peculiar/x509'

// Parse an X.509 certificate (PEM or DER) into its key fields. Construction only
// decodes ASN.1 — no WebCrypto — so this is pure and unit-testable. The raw DER is
// returned so the UI can compute a fingerprint with hash-wasm.

export interface CertInfo {
  subject: string
  issuer: string
  notBefore: Date
  notAfter: Date
  serialNumber: string
  signatureAlgorithm: string
  san: string[]
  der: Uint8Array
}

function algorithmName(algo: unknown): string {
  if (algo && typeof algo === 'object') {
    const a = algo as { name?: string; hash?: { name?: string } }
    return [a.name, a.hash?.name].filter(Boolean).join(' ') || 'unknown'
  }
  return String(algo)
}

export function parseCertificate(input: string): CertInfo {
  const cert = new X509Certificate(input.trim())

  let san: string[] = []
  try {
    const ext = cert.getExtension(SubjectAlternativeNameExtension)
    if (ext) san = ext.names.items.map((n) => `${n.type}: ${n.value}`)
  } catch {
    // SAN extension absent or unparseable — leave empty.
  }

  return {
    subject: cert.subject,
    issuer: cert.issuer,
    notBefore: cert.notBefore,
    notAfter: cert.notAfter,
    serialNumber: cert.serialNumber,
    signatureAlgorithm: algorithmName(cert.signatureAlgorithm),
    san,
    der: new Uint8Array(cert.rawData),
  }
}

export type CertStatus = 'valid' | 'expired' | 'not-yet-valid'

export function certStatus(info: CertInfo, now: number = Date.now()): CertStatus {
  if (now < info.notBefore.getTime()) return 'not-yet-valid'
  if (now > info.notAfter.getTime()) return 'expired'
  return 'valid'
}

/** Format a hex digest as uppercase colon-separated byte pairs. */
export function formatFingerprint(hex: string): string {
  return (hex.toUpperCase().match(/.{2}/g) ?? []).join(':')
}
