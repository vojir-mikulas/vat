import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { REGEX_FLAGS, runRegex, type RegexFlag, type RegexMatch } from './regex'

function highlight(text: string, matches: RegexMatch[]): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  matches.forEach((m, i) => {
    if (m.index > last) nodes.push(<span key={`t${i}`}>{text.slice(last, m.index)}</span>)
    nodes.push(
      <mark key={`m${i}`} className="rounded bg-warn/40 text-foreground">
        {m.match}
      </mark>,
    )
    last = Math.max(last, m.index + m.match.length)
  })
  if (last < text.length) nodes.push(<span key="end">{text.slice(last)}</span>)
  return nodes
}

export default function RegexTool() {
  const { t } = useTranslation('tools')
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState<Record<RegexFlag, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  })
  const [text, setText] = useState('')

  const flagStr = REGEX_FLAGS.filter((f) => flags[f]).join('')

  const result = useMemo(() => {
    try {
      return { matches: runRegex(pattern, flagStr, text), error: null as string | null }
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : t('regex.invalid') }
    }
  }, [pattern, flagStr, text, t])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="re-pattern"
          className="text-2xs uppercase tracking-wide text-muted-foreground"
        >
          {t('regex.patternLabel')}
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="re-pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={t('regex.patternPlaceholder')}
            aria-invalid={Boolean(result.error)}
            className="min-w-48 flex-1 font-mono text-sm"
            autoFocus
          />
          <div className="inline-flex items-center gap-0.5 rounded-md border bg-surface-1 p-0.5">
            {REGEX_FLAGS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={flags[f]}
                title={t(`regex.flag.${f}`)}
                onClick={() => setFlags((s) => ({ ...s, [f]: !s[f] }))}
                className={cn(
                  'size-7 cursor-pointer rounded font-mono text-sm transition-colors',
                  flags[f]
                    ? 'bg-surface-2 text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {result.error ? <p className="text-sm text-err-foreground">{result.error}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="re-text" className="text-2xs uppercase tracking-wide text-muted-foreground">
          {t('regex.textLabel')}
        </Label>
        <Textarea
          id="re-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('regex.textPlaceholder')}
          spellCheck={false}
          className="min-h-40 resize-y font-mono text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xs uppercase tracking-wide text-muted-foreground">
          {t('regex.matches')}
        </span>
        {!result.error && text ? <Badge variant="outline">{result.matches.length}</Badge> : null}
      </div>

      {!result.error && text ? (
        <div className="markdown-body whitespace-pre-wrap break-words rounded-md border bg-surface-1 px-4 py-3 font-mono text-sm">
          {result.matches.length > 0 ? highlight(text, result.matches) : text}
        </div>
      ) : null}

      {result.matches.length > 0 ? (
        <ol className="flex flex-col gap-1.5">
          {result.matches.map((m, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border bg-surface-1 px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground tabular-nums">#{i + 1}</span>
              <span className="font-mono">{m.match}</span>
              <span className="text-2xs text-muted-foreground">
                {t('regex.atIndex', { index: m.index })}
              </span>
              {m.groups.length > 0 ? (
                <span className="text-2xs text-muted-foreground">
                  {t('regex.groups')}: {m.groups.map((g) => g ?? '∅').join(', ')}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
