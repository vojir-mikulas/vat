import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResultField } from '@/components/common/result-field'
import { formatParts, parseTimestamp } from './timestamp'

export default function TimestampTool() {
  const { t } = useTranslation('tools')
  const [input, setInput] = useState('')

  const date = useMemo(() => parseTimestamp(input), [input])
  const parts = useMemo(() => (date ? formatParts(date) : null), [date])
  const invalid = input.trim() !== '' && date === null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="ts-input"
          className="text-2xs uppercase tracking-wide text-muted-foreground"
        >
          {t('timestamp.inputLabel')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="ts-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('timestamp.inputPlaceholder')}
            aria-invalid={invalid}
            className="font-mono text-sm"
            autoFocus
          />
          <Button variant="outline" onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>
            <Clock />
            {t('timestamp.now')}
          </Button>
        </div>
        {invalid ? <p className="text-sm text-err-foreground">{t('timestamp.invalid')}</p> : null}
      </div>

      {parts ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <ResultField label={t('timestamp.unixSeconds')} value={parts.unixS} />
          <ResultField label={t('timestamp.unixMillis')} value={parts.unixMs} />
          <ResultField label={t('timestamp.iso')} value={parts.iso} />
          <ResultField label={t('timestamp.utc')} value={parts.utc} mono={false} />
          <ResultField label={t('timestamp.local')} value={parts.local} mono={false} />
          <ResultField label={t('timestamp.relative')} value={parts.relative} mono={false} />
        </div>
      ) : null}
    </div>
  )
}
