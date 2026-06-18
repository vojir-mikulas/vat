import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResultField } from '@/components/common/result-field'
import { parseOtpUri } from './otp'

export default function OtpTool() {
  const { t } = useTranslation('tools')
  const [uri, setUri] = useState('')

  const parsed = useMemo(() => {
    if (!uri.trim()) return null
    try {
      return { info: parseOtpUri(uri), error: null as string | null }
    } catch (e) {
      return { info: null, error: e instanceof Error ? e.message : t('otp.invalid') }
    }
  }, [uri, t])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="otp-uri" className="text-2xs uppercase tracking-wide text-muted-foreground">
          {t('otp.inputLabel')}
        </Label>
        <Input
          id="otp-uri"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          placeholder={t('otp.inputPlaceholder')}
          aria-invalid={Boolean(parsed?.error)}
          className="font-mono text-sm"
          autoFocus
        />
        {parsed?.error ? <p className="text-sm text-err-foreground">{parsed.error}</p> : null}
      </div>

      {parsed?.info ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <ResultField label={t('otp.type')} value={parsed.info.type.toUpperCase()} mono={false} />
          <ResultField label={t('otp.issuer')} value={parsed.info.issuer ?? ''} mono={false} />
          <ResultField label={t('otp.account')} value={parsed.info.account} mono={false} />
          <ResultField label={t('otp.secret')} value={parsed.info.secret} />
          <ResultField label={t('otp.algorithm')} value={parsed.info.algorithm} mono={false} />
          <ResultField label={t('otp.digits')} value={String(parsed.info.digits)} mono={false} />
          {parsed.info.period !== undefined ? (
            <ResultField
              label={t('otp.period')}
              value={t('otp.seconds', { count: parsed.info.period })}
              mono={false}
            />
          ) : null}
          {parsed.info.counter !== undefined ? (
            <ResultField
              label={t('otp.counter')}
              value={String(parsed.info.counter)}
              mono={false}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
