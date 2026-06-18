import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CodePane } from '@/components/common/code-pane'
import { CopyButton } from '@/components/common/copy-button'
import { SQL_DIALECTS, conciseError, formatSql, type Dialect } from './sql'
import { tokenizeSql, type TokenKind } from './highlight'

const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: 'text-[var(--syntax-keyword)] font-medium',
  function: 'text-[var(--syntax-function)]',
  string: 'text-[var(--syntax-string)]',
  number: 'text-[var(--syntax-number)]',
  comment: 'text-[var(--syntax-comment)] italic',
  operator: 'text-[var(--syntax-operator)]',
  punctuation: 'text-[var(--syntax-punctuation)]',
  plain: '',
}

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

  const tokens = useMemo(() => (output ? tokenizeSql(output) : []), [output])

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

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex h-8 items-center justify-between gap-2">
            <Label className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t('sql.outputLabel')}
            </Label>
            <CopyButton value={output} />
          </div>
          <pre
            aria-invalid={Boolean(error)}
            className={cn(
              'min-h-72 overflow-auto rounded-md border border-input bg-surface-1 px-3 py-2 font-mono text-sm whitespace-pre-wrap shadow-xs',
              'aria-invalid:border-destructive',
              error && 'text-err',
            )}
          >
            {error ? (
              error
            ) : (
              <code>
                {tokens.map((tk, i) => (
                  <span key={i} className={TOKEN_CLASS[tk.kind]}>
                    {tk.value}
                  </span>
                ))}
              </code>
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}
