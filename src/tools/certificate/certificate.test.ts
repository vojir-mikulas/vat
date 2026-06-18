import { describe, expect, it } from 'vitest'

import { certStatus, formatFingerprint, parseCertificate } from './certificate'

// Self-signed test cert: CN=vat.example.com, O=VAT Test, C=US,
// SAN dns:vat.example.com / www.vat.example.com, valid 2026–2036.
const CERT = `-----BEGIN CERTIFICATE-----
MIIDiDCCAnCgAwIBAgIUQGgIa9+b0p6367kNo+SThidSTPYwDQYJKoZIhvcNAQEL
BQAwOjEYMBYGA1UEAwwPdmF0LmV4YW1wbGUuY29tMREwDwYDVQQKDAhWQVQgVGVz
dDELMAkGA1UEBhMCVVMwHhcNMjYwNjE4MTQxNDQzWhcNMzYwNjE1MTQxNDQzWjA6
MRgwFgYDVQQDDA92YXQuZXhhbXBsZS5jb20xETAPBgNVBAoMCFZBVCBUZXN0MQsw
CQYDVQQGEwJVUzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALNqFS/t
MZSu0FD4am1Q4aDxYiKWEVhA/rTfK22KcSVgezttBmj+5X9dsvUPBxCRbE8Ntr1W
tYNb9+oi7KJRXfmn387PPOWzuOfmlOI3ktH/rhDmFKvqBx9DiHLf0J7eZ2IQrif3
Tm3RMgI8DRz4X6ioyrELw9T6p8nx/CRtRwpDepcleiYzQ6sVXUnI6G7Wpq1x0DxG
hA+mA7bgPvbBoPSCqN4b3sR/Q0Pm6PpHQ+GaabSJ9zz8jEhOp1YwSAo0cWECHUNf
92gen7b/Yhb9aUT4ZVCXkU6pDGGAgYmheGeu7uEBZHL73lHmLIKltyKwi1vIJIzz
asQBcwTG4G5Gc9kCAwEAAaOBhTCBgjAdBgNVHQ4EFgQUXesQm4+d5yaatWUga2h9
tASs5X4wHwYDVR0jBBgwFoAUXesQm4+d5yaatWUga2h9tASs5X4wDwYDVR0TAQH/
BAUwAwEB/zAvBgNVHREEKDAmgg92YXQuZXhhbXBsZS5jb22CE3d3dy52YXQuZXhh
bXBsZS5jb20wDQYJKoZIhvcNAQELBQADggEBAF5E1qAkP4nNVqzNuOEakoIkhi1C
BE65ElaQs+xlvX7MfGIFRPTRVY6xxPipuBu4IOH+M+gsN5N1Sun11oRKviTE05kw
dvohpu9uvNaF67Dp+CDyhJ4Y8s45nKitVpOnQLsTgGNpwAi2wGeJoK6vlCkqZr5L
SOL/TlCR1aZmtuvBp3rcbVpYaV8nMhOQs5ZQVGFgAMTTt0epb4sgLl0Az19RftwZ
4eLpjaVta+cnAX7xOoFStgtGkCn/4UxUeqquGmMe+UDACSyyz5TvoAg/ar8+yDkP
bYINyQe1dbvJCchxs4A8FHw47tErf59ZKNgG/N2ENlGun2IkfIvU52XqOFo=
-----END CERTIFICATE-----`

describe('parseCertificate', () => {
  it('extracts subject, issuer, and serial', () => {
    const info = parseCertificate(CERT)
    expect(info.subject).toContain('vat.example.com')
    expect(info.subject).toContain('VAT Test')
    expect(info.issuer).toContain('vat.example.com') // self-signed
    expect(info.serialNumber.length).toBeGreaterThan(0)
    expect(info.der.length).toBeGreaterThan(0)
  })

  it('reads validity dates and SAN entries', () => {
    const info = parseCertificate(CERT)
    expect(info.notAfter.getTime()).toBeGreaterThan(info.notBefore.getTime())
    expect(info.san.some((s) => s.includes('vat.example.com'))).toBe(true)
  })

  it('computes validity status against a clock', () => {
    const info = parseCertificate(CERT)
    expect(certStatus(info, info.notBefore.getTime() + 1000)).toBe('valid')
    expect(certStatus(info, info.notAfter.getTime() + 1000)).toBe('expired')
    expect(certStatus(info, info.notBefore.getTime() - 1000)).toBe('not-yet-valid')
  })

  it('throws on invalid input', () => {
    expect(() => parseCertificate('not a certificate')).toThrow()
  })

  it('formats fingerprints as colon-separated pairs', () => {
    expect(formatFingerprint('abcd1234')).toBe('AB:CD:12:34')
  })
})
