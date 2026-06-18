import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CodePane } from '@/components/common/code-pane'
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
        <CodePane
          label={t('base64.inputLabel')}
          value={input}
          onChange={setInput}
          placeholder={t('base64.inputPlaceholder')}
          rows="lg"
          autoFocus
        />
        <CodePane label={t('base64.outputLabel')} value={output} error={error} copy rows="lg" />
      </div>
    </div>
  )
}
