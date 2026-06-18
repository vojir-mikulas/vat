import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CodePane } from '@/components/common/code-pane'
import { SQL_DIALECTS, conciseError, formatSql, type Dialect } from './sql'

export default function SqlTool() {
  const { t } = useTranslation('tools')
  const [input, setInput] = useState('')
  const [dialect, setDialect] = useState<Dialect>('sql')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null as string | null }
    try {
      return { output: formatSql(input, dialect), error: null as string | null }
    } catch (e) {
      return { output: '', error: conciseError(e) }
    }
  }, [input, dialect])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-2xs uppercase tracking-wide text-muted-foreground">
          {t('sql.dialect')}
        </span>
        <Select value={dialect} onValueChange={(v) => setDialect(v as Dialect)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SQL_DIALECTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CodePane
          label={t('sql.inputLabel')}
          value={input}
          onChange={setInput}
          placeholder={t('sql.inputPlaceholder')}
          rows="lg"
          autoFocus
        />
        <CodePane
          label={t('sql.outputLabel')}
          value={output}
          error={error}
          language="sql"
          copy
          rows="lg"
        />
      </div>
    </div>
  )
}
