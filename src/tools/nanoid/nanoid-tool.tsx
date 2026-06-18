import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CodePane } from '@/components/common/code-pane'
import { generateNanoIds, type NanoidPreset } from './nanoid'

const PRESETS: NanoidPreset[] = ['urlSafe', 'alphanumeric', 'lowercase', 'numbers', 'hex']

export default function NanoidTool() {
  const { t } = useTranslation('tools')
  const [size, setSize] = useState(21)
  const [count, setCount] = useState(5)
  const [preset, setPreset] = useState<NanoidPreset>('urlSafe')
  const [nonce, setNonce] = useState(0)

  const output = useMemo(
    () => generateNanoIds(size, count, preset).join('\n'),
    // nonce intentionally re-runs the generator on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size, count, preset, nonce],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="nanoid-size"
            className="text-2xs uppercase tracking-wide text-muted-foreground"
          >
            {t('nanoid.size')}
          </Label>
          <Input
            id="nanoid-size"
            type="number"
            min={1}
            max={256}
            value={size}
            onChange={(e) => setSize(Math.max(1, Math.min(256, Number(e.target.value) || 1)))}
            className="w-24"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="nanoid-count"
            className="text-2xs uppercase tracking-wide text-muted-foreground"
          >
            {t('nanoid.count')}
          </Label>
          <Input
            id="nanoid-count"
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
            className="w-24"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-2xs uppercase tracking-wide text-muted-foreground">
            {t('nanoid.alphabet')}
          </span>
          <Select value={preset} onValueChange={(v) => setPreset(v as NanoidPreset)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(`nanoid.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={() => setNonce((n) => n + 1)} className="ml-auto">
          <RefreshCw />
          {t('nanoid.regenerate')}
        </Button>
      </div>

      <CodePane label={t('nanoid.outputLabel')} value={output} copy rows="lg" />
    </div>
  )
}
