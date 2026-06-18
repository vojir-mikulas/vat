import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ResultField } from '@/components/common/result-field'
import { entropyBits, generatePassword, type CharSet } from './password'

const TOGGLES: CharSet[] = ['lower', 'upper', 'digits', 'symbols']

function strengthKey(bits: number): 'weak' | 'fair' | 'good' | 'strong' {
  if (bits < 40) return 'weak'
  if (bits < 70) return 'fair'
  if (bits < 100) return 'good'
  return 'strong'
}

const STRENGTH_CLASS = {
  weak: 'text-err-foreground',
  fair: 'text-warn-foreground',
  good: 'text-info-foreground',
  strong: 'text-ok-foreground',
} as const

export default function PasswordTool() {
  const { t } = useTranslation('tools')
  const [length, setLength] = useState(20)
  const [sets, setSets] = useState({ lower: true, upper: true, digits: true, symbols: false })
  const [nonce, setNonce] = useState(0)

  const opts = useMemo(() => ({ length, ...sets }), [length, sets])
  const password = useMemo(
    () => generatePassword(opts),
    // nonce intentionally re-runs the generator on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts, nonce],
  )
  const bits = entropyBits(opts)
  const strength = strengthKey(bits)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="pw-length"
            className="text-2xs uppercase tracking-wide text-muted-foreground"
          >
            {t('password.length')}
          </Label>
          <Input
            id="pw-length"
            type="number"
            min={1}
            max={256}
            value={length}
            onChange={(e) => setLength(Math.max(1, Math.min(256, Number(e.target.value) || 1)))}
            className="w-24"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {TOGGLES.map((key) => (
            <Label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-normal">
              <Switch
                checked={sets[key]}
                onCheckedChange={(v) => setSets((s) => ({ ...s, [key]: v }))}
              />
              {t(`password.${key}`)}
            </Label>
          ))}
        </div>

        <Button variant="outline" onClick={() => setNonce((n) => n + 1)} className="ml-auto">
          <RefreshCw />
          {t('password.regenerate')}
        </Button>
      </div>

      <ResultField label={t('password.outputLabel')} value={password} />

      {password ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className={STRENGTH_CLASS[strength]}>
            {t(`password.${strength}`)}
          </Badge>
          <span>{t('password.entropy', { bits })}</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('password.noSet')}</p>
      )}
    </div>
  )
}
