import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodePane } from '@/components/common/code-pane'
import { jsonToYaml, yamlToJson } from './json-yaml'

type Direction = 'j2y' | 'y2j'

export default function JsonYamlTool() {
  const { t } = useTranslation('tools')
  const [direction, setDirection] = useState<Direction>('j2y')
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null as string | null }
    try {
      const result = direction === 'j2y' ? jsonToYaml(input) : yamlToJson(input)
      return { output: result, error: null as string | null }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : t('json-yaml.invalid') }
    }
  }, [input, direction, t])

  const inputLabel = direction === 'j2y' ? t('json-yaml.json') : t('json-yaml.yaml')
  const outputLabel = direction === 'j2y' ? t('json-yaml.yaml') : t('json-yaml.json')

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={direction} onValueChange={(v) => setDirection(v as Direction)}>
        <TabsList>
          <TabsTrigger value="j2y">{t('json-yaml.jsonToYaml')}</TabsTrigger>
          <TabsTrigger value="y2j">{t('json-yaml.yamlToJson')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2">
        <CodePane
          label={inputLabel}
          value={input}
          onChange={setInput}
          placeholder={t('json-yaml.inputPlaceholder')}
          rows="lg"
          autoFocus
        />
        <CodePane
          label={outputLabel}
          value={output}
          error={error}
          language={direction === 'j2y' ? 'yaml' : 'json'}
          copy
          rows="lg"
        />
      </div>
    </div>
  )
}
