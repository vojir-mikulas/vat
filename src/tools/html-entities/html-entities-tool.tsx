import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodePane } from '@/components/common/code-pane'
import { decodeHtml, encodeHtml } from './html-entities'

type Mode = 'encode' | 'decode'

export default function HtmlEntitiesTool() {
  const { t } = useTranslation('tools')
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState('')

  const output = useMemo(() => {
    if (!input) return ''
    return mode === 'encode' ? encodeHtml(input) : decodeHtml(input)
  }, [input, mode])

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList>
          <TabsTrigger value="encode">{t('html.encode')}</TabsTrigger>
          <TabsTrigger value="decode">{t('html.decode')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2">
        <CodePane
          label={t('html.inputLabel')}
          value={input}
          onChange={setInput}
          placeholder={t('html.inputPlaceholder')}
          rows="lg"
          autoFocus
        />
        <CodePane label={t('html.outputLabel')} value={output} copy rows="lg" />
      </div>
    </div>
  )
}
