import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { CodePane } from '@/components/common/code-pane'
import { decodeJwt, readClaimDates } from './jwt'

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

export default function JwtTool() {
  const { t } = useTranslation('tools')
  const [input, setInput] = useState('')

  const decoded = useMemo(() => {
    if (!input.trim()) return null
    try {
      return { ok: true as const, ...decodeJwt(input) }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : t('jwt.invalid') }
    }
  }, [input, t])

  const claimDates = useMemo(() => (decoded?.ok ? readClaimDates(decoded.payload) : []), [decoded])

  return (
    <div className="flex flex-col gap-4">
      <CodePane
        label={t('jwt.tokenLabel')}
        value={input}
        onChange={setInput}
        placeholder={t('jwt.tokenPlaceholder')}
        rows="sm"
        autoFocus
        headerActions={
          <button
            type="button"
            onClick={() => setInput(SAMPLE)}
            className="cursor-pointer text-2xs text-brand hover:underline"
          >
            {t('jwt.loadSample')}
          </button>
        }
      />

      {decoded && !decoded.ok ? (
        <p className="rounded-lg border border-err-border bg-err-bg px-4 py-3 text-sm text-err-foreground">
          {decoded.error}
        </p>
      ) : null}

      {decoded?.ok ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <CodePane
              label={t('jwt.header')}
              value={JSON.stringify(decoded.header, null, 2)}
              copy
            />
            <CodePane
              label={t('jwt.payload')}
              value={JSON.stringify(decoded.payload, null, 2)}
              copy
            />
          </div>

          {claimDates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {claimDates.map((c) => (
                <Badge
                  key={c.claim}
                  variant="outline"
                  className={c.expired ? 'text-err-foreground' : undefined}
                >
                  <span className="font-mono uppercase">{c.claim}</span>
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    {c.date.toLocaleString()}
                    {c.expired ? ` · ${t('jwt.expired')}` : ''}
                  </span>
                </Badge>
              ))}
            </div>
          ) : null}

          <CodePane label={t('jwt.signature')} value={decoded.signature} rows="sm" copy />
          <p className="text-2xs text-muted-foreground">{t('jwt.noVerify')}</p>
        </>
      ) : null}
    </div>
  )
}
