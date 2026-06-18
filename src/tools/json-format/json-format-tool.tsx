import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodePane } from '@/components/common/code-pane'
import { formatJson, minifyJson, type Indent } from './json-format'

type Mode = 'beautify' | 'minify'

const INDENTS: { value: Indent; key: 'spaces2' | 'spaces4' | 'tab' }[] = [
  { value: 2, key: 'spaces2' },
  { value: 4, key: 'spaces4' },
  { value: 'tab', key: 'tab' },
]

export default function JsonFormatTool() {
  const { t } = useTranslation('tools')
  const [mode, setMode] = useState<Mode>('beautify')
  const [indent, setIndent] = useState<Indent>(2)
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null as string | null }
    try {
      const result = mode === 'beautify' ? formatJson(input, indent) : minifyJson(input)
      return { output: result, error: null as string | null }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : t('json.invalid') }
    }
  }, [input, mode, indent, t])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList>
            <TabsTrigger value="beautify">{t('json.beautify')}</TabsTrigger>
            <TabsTrigger value="minify">{t('json.minify')}</TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === 'beautify' ? (
          <div
            role="radiogroup"
            aria-label={t('json.indent')}
            className="inline-flex items-center gap-0.5 rounded-md border bg-surface-1 p-0.5"
          >
            {INDENTS.map((opt) => {
              const active = indent === opt.value
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setIndent(opt.value)}
                  className={cn(
                    'cursor-pointer rounded px-2.5 py-1 text-xs transition-colors',
                    active
                      ? 'bg-surface-2 text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`json.${opt.key}`)}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CodePane
          label={t('json.inputLabel')}
          value={input}
          onChange={setInput}
          placeholder={t('json.inputPlaceholder')}
          rows="lg"
          autoFocus
        />
        <CodePane
          label={t('json.outputLabel')}
          value={output}
          error={error}
          language="json"
          copy
          rows="lg"
        />
      </div>
    </div>
  )
}
