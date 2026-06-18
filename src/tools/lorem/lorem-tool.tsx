import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CodePane } from '@/components/common/code-pane'
import { generateLorem, type LoremUnit } from './lorem'

const UNITS: LoremUnit[] = ['paragraphs', 'sentences', 'words']

export default function LoremTool() {
  const { t } = useTranslation('tools')
  const [count, setCount] = useState(3)
  const [unit, setUnit] = useState<LoremUnit>('paragraphs')
  const [startWithLorem, setStartWithLorem] = useState(true)
  // Bumped to reshuffle with the same settings (the generator is random).
  const [nonce, setNonce] = useState(0)

  const output = useMemo(
    () => generateLorem(count, unit, startWithLorem),
    // nonce intentionally re-runs the random generator on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, unit, startWithLorem, nonce],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="lorem-count"
            className="text-2xs uppercase tracking-wide text-muted-foreground"
          >
            {t('lorem.amount')}
          </Label>
          <Input
            id="lorem-count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="w-24"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-2xs uppercase tracking-wide text-muted-foreground">
            {t('lorem.unit')}
          </span>
          <div
            role="radiogroup"
            aria-label={t('lorem.unit')}
            className="inline-flex items-center gap-0.5 rounded-md border bg-surface-1 p-0.5"
          >
            {UNITS.map((u) => {
              const active = unit === u
              return (
                <button
                  key={u}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setUnit(u)}
                  className={cn(
                    'cursor-pointer rounded px-2.5 py-1 text-xs transition-colors',
                    active
                      ? 'bg-surface-2 text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`lorem.${u}`)}
                </button>
              )
            })}
          </div>
        </div>

        <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
          <Switch checked={startWithLorem} onCheckedChange={setStartWithLorem} />
          {t('lorem.startWithLorem')}
        </Label>

        <Button variant="outline" onClick={() => setNonce((n) => n + 1)} className="ml-auto">
          <RefreshCw />
          {t('lorem.regenerate')}
        </Button>
      </div>

      <CodePane label={t('lorem.outputLabel')} value={output} copy rows="lg" />
    </div>
  )
}
