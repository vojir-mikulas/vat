import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sha256 } from 'hash-wasm'

import { Badge } from '@/components/ui/badge'
import { Dropzone } from '@/components/common/dropzone'
import { CodePane } from '@/components/common/code-pane'
import { ResultField } from '@/components/common/result-field'
import { certStatus, formatFingerprint, parseCertificate, type CertStatus } from './certificate'

const STATUS_CLASS: Record<CertStatus, string> = {
  valid: 'text-ok-foreground',
  expired: 'text-err-foreground',
  'not-yet-valid': 'text-warn-foreground',
}

export default function CertificateTool() {
  const { t } = useTranslation('tools')
  const [pem, setPem] = useState('')
  const [fingerprint, setFingerprint] = useState('')

  const parsed = useMemo(() => {
    if (!pem.trim()) return null
    try {
      return { info: parseCertificate(pem), error: null as string | null }
    } catch (e) {
      return { info: null, error: e instanceof Error ? e.message : t('certificate.invalid') }
    }
  }, [pem, t])

  useEffect(() => {
    if (!parsed?.info) return
    let active = true
    void sha256(parsed.info.der).then((hex) => {
      if (active) setFingerprint(formatFingerprint(hex))
    })
    return () => {
      active = false
    }
  }, [parsed])

  const info = parsed?.info
  const status = info ? certStatus(info) : null

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        accept=".pem,.crt,.cer,.cert"
        prompt={t('certificate.prompt')}
        onFile={(f) => void f.text().then(setPem)}
      />
      <CodePane
        label={t('certificate.pemLabel')}
        value={pem}
        onChange={setPem}
        placeholder={t('certificate.pemPlaceholder')}
        rows="sm"
      />
      {parsed?.error ? <p className="text-sm text-err-foreground">{parsed.error}</p> : null}

      {info && status ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t('certificate.status')}
            </span>
            <Badge variant="outline" className={STATUS_CLASS[status]}>
              {t(`certificate.${status === 'not-yet-valid' ? 'notYetValid' : status}`)}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ResultField label={t('certificate.subject')} value={info.subject} mono={false} />
            <ResultField label={t('certificate.issuer')} value={info.issuer} mono={false} />
            <ResultField
              label={t('certificate.notBefore')}
              value={info.notBefore.toLocaleString()}
              mono={false}
            />
            <ResultField
              label={t('certificate.notAfter')}
              value={info.notAfter.toLocaleString()}
              mono={false}
            />
            <ResultField label={t('certificate.serial')} value={info.serialNumber} />
            <ResultField
              label={t('certificate.signatureAlgorithm')}
              value={info.signatureAlgorithm}
              mono={false}
            />
          </div>
          {info.san.length > 0 ? (
            <ResultField label={t('certificate.san')} value={info.san.join(', ')} mono={false} />
          ) : null}
          <ResultField label={t('certificate.fingerprint')} value={fingerprint} />
        </div>
      ) : null}
    </div>
  )
}
