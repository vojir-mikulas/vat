import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResultField } from '@/components/common/result-field'
import { convertColor } from './color'

export default function ColorTool() {
  const { t } = useTranslation('tools')
  const [input, setInput] = useState('#0057b8')

  const result = useMemo(() => convertColor(input), [input])
  const invalid = input.trim() !== '' && !result.valid

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="color-input"
          className="text-2xs uppercase tracking-wide text-muted-foreground"
        >
          {t('color.inputLabel')}
        </Label>
        <div className="flex items-center gap-3">
          <span
            className="size-10 shrink-0 rounded-lg border"
            style={result.valid ? { backgroundColor: result.hex } : undefined}
            aria-hidden
          />
          <input
            type="color"
            aria-label={t('color.picker')}
            value={result.valid ? result.hex : '#000000'}
            onChange={(e) => setInput(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border bg-surface-1 p-1"
          />
          <Input
            id="color-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('color.inputPlaceholder')}
            aria-invalid={invalid}
            className="font-mono text-sm"
            autoFocus
          />
        </div>
        {invalid ? <p className="text-sm text-err-foreground">{t('color.invalid')}</p> : null}
      </div>

      {result.valid ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <ResultField label={t('color.hex')} value={result.hex} />
          <ResultField label={t('color.rgb')} value={result.rgb} />
          <ResultField label={t('color.hsl')} value={result.hsl} />
        </div>
      ) : null}
    </div>
  )
}
