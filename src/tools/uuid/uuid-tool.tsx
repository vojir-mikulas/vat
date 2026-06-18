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
import { generateUuids, type UuidVersion } from './uuid'

const VERSIONS: { value: UuidVersion; label: string }[] = [
  { value: 'v4', label: 'v4 (random)' },
  { value: 'v7', label: 'v7 (time-ordered)' },
  { value: 'v1', label: 'v1 (time)' },
  { value: 'v6', label: 'v6 (time, sortable)' },
  { value: 'nil', label: 'nil' },
]

export default function UuidTool() {
  const { t } = useTranslation('tools')
  const [version, setVersion] = useState<UuidVersion>('v4')
  const [count, setCount] = useState(5)
  const [nonce, setNonce] = useState(0)

  const output = useMemo(
    () => generateUuids(version, count).join('\n'),
    // nonce intentionally re-runs the generator on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, count, nonce],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-2xs uppercase tracking-wide text-muted-foreground">
            {t('uuid.version')}
          </span>
          <Select value={version} onValueChange={(v) => setVersion(v as UuidVersion)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERSIONS.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="uuid-count"
            className="text-2xs uppercase tracking-wide text-muted-foreground"
          >
            {t('uuid.count')}
          </Label>
          <Input
            id="uuid-count"
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
            className="w-24"
          />
        </div>

        <Button variant="outline" onClick={() => setNonce((n) => n + 1)} className="ml-auto">
          <RefreshCw />
          {t('uuid.regenerate')}
        </Button>
      </div>

      <CodePane label={t('uuid.outputLabel')} value={output} copy rows="lg" />
    </div>
  )
}
