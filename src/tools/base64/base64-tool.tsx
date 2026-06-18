import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CopyButton } from '@/components/common/copy-button'
import { decodeBase64, encodeBase64 } from './base64'

type Mode = 'encode' | 'decode'

// Reference tool: the canonical example every other tool follows — pure logic in
// a sibling .ts module (tested), a default-exported component here, all strings
// via the `tools` i18n namespace, and live conversion as the user types.
export default function Base64Tool() {
  const { t } = useTranslation('tools')
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState('')
  const [urlSafe, setUrlSafe] = useState(false)

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null as string | null }
    try {
      const result = mode === 'encode' ? encodeBase64(input, urlSafe) : decodeBase64(input)
      return { output: result, error: null as string | null }
    } catch {
      return { output: '', error: t('base64.invalid') }
    }
  }, [input, mode, urlSafe, t])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList>
            <TabsTrigger value="encode">{t('base64.encode')}</TabsTrigger>
            <TabsTrigger value="decode">{t('base64.decode')}</TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === 'encode' ? (
          <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
            <Switch checked={urlSafe} onCheckedChange={setUrlSafe} />
            {t('base64.urlSafe')}
          </Label>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="b64-input"
            className="text-2xs uppercase tracking-wide text-muted-foreground"
          >
            {t('base64.inputLabel')}
          </Label>
          <Textarea
            id="b64-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('base64.inputPlaceholder')}
            className="min-h-56 resize-y font-mono text-sm"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t('base64.outputLabel')}
            </Label>
            <CopyButton value={output} />
          </div>
          <Textarea
            readOnly
            value={error ?? output}
            aria-invalid={Boolean(error)}
            className={cn('min-h-56 resize-y font-mono text-sm', error && 'text-err')}
          />
        </div>
      </div>
    </div>
  )
}
