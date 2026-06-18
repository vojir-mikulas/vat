import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { describeCron, nextRuns } from './cron'

export default function CronTool() {
  const { t } = useTranslation('tools')
  const [expr, setExpr] = useState('*/5 * * * *')

  const result = useMemo(() => {
    if (!expr.trim()) return null
    try {
      return { ok: true as const, description: describeCron(expr), runs: nextRuns(expr, 5) }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : t('cron.invalid') }
    }
  }, [expr, t])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="cron-input"
          className="text-2xs uppercase tracking-wide text-muted-foreground"
        >
          {t('cron.inputLabel')}
        </Label>
        <Input
          id="cron-input"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder={t('cron.inputPlaceholder')}
          aria-invalid={result ? !result.ok : false}
          className="font-mono text-sm"
          autoFocus
        />
      </div>

      {result && !result.ok ? (
        <p className="rounded-lg border border-err-border bg-err-bg px-4 py-3 text-sm text-err-foreground">
          {result.error}
        </p>
      ) : null}

      {result?.ok ? (
        <>
          <div className="rounded-lg border bg-surface-1 px-4 py-3">
            <p className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t('cron.description_label')}
            </p>
            <p className="mt-1 text-base font-medium">{result.description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t('cron.nextRuns')}
            </p>
            <ol className="overflow-hidden rounded-lg border font-mono text-sm">
              {result.runs.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 border-b px-4 py-2 last:border-b-0 odd:bg-surface-1"
                >
                  <span className="text-muted-foreground tabular-nums">{i + 1}</span>
                  <span>{d.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      ) : null}
    </div>
  )
}
