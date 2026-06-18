import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ResultField } from '@/components/common/result-field'
import { HMAC_ALGOS, HMAC_LABELS, hmac, type HmacAlgo } from './hmac'

export default function HmacTool() {
  const { t } = useTranslation('tools')
  const [message, setMessage] = useState('')
  const [key, setKey] = useState('')
  const [algo, setAlgo] = useState<HmacAlgo>('sha256')
  const [digest, setDigest] = useState('')

  useEffect(() => {
    if (!message && !key) return
    let active = true
    void hmac(message, key, algo).then((result) => {
      if (active) setDigest(result)
    })
    return () => {
      active = false
    }
  }, [message, key, algo])

  // Derive the empty state during render instead of clearing via setState.
  const display = message || key ? digest : ''

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="hmac-msg"
            className="text-2xs uppercase tracking-wide text-muted-foreground"
          >
            {t('hmac.messageLabel')}
          </Label>
          <Textarea
            id="hmac-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('hmac.messagePlaceholder')}
            spellCheck={false}
            className="min-h-32 resize-y font-mono text-sm"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="hmac-key"
              className="text-2xs uppercase tracking-wide text-muted-foreground"
            >
              {t('hmac.keyLabel')}
            </Label>
            <Input
              id="hmac-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t('hmac.keyPlaceholder')}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t('hmac.algorithm')}
            </span>
            <Select value={algo} onValueChange={(v) => setAlgo(v as HmacAlgo)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HMAC_ALGOS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {HMAC_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ResultField label={t('hmac.outputLabel')} value={display} />
    </div>
  )
}
