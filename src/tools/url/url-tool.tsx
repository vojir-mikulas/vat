import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CodePane } from '@/components/common/code-pane'
import { decodeUrl, encodeUrl } from './url'

type Mode = 'encode' | 'decode'

export default function UrlTool() {
  const { t } = useTranslation('tools')
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState('')
  const [wholeUrl, setWholeUrl] = useState(false)

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null as string | null }
    try {
      const result = mode === 'encode' ? encodeUrl(input, wholeUrl) : decodeUrl(input)
      return { output: result, error: null as string | null }
    } catch {
      return { output: '', error: t('url.invalid') }
    }
  }, [input, mode, wholeUrl, t])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList>
            <TabsTrigger value="encode">{t('url.encode')}</TabsTrigger>
            <TabsTrigger value="decode">{t('url.decode')}</TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === 'encode' ? (
          <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
            <Switch checked={wholeUrl} onCheckedChange={setWholeUrl} />
            {t('url.wholeUrl')}
          </Label>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CodePane
          label={t('url.inputLabel')}
          value={input}
          onChange={setInput}
          placeholder={t('url.inputPlaceholder')}
          rows="lg"
          autoFocus
        />
        <CodePane label={t('url.outputLabel')} value={output} error={error} copy rows="lg" />
      </div>
    </div>
  )
}
