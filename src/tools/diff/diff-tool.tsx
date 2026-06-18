import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CodePane } from '@/components/common/code-pane'
import { diffStats, toDiffLines, type DiffLineType } from './diff'

const LINE_STYLE: Record<DiffLineType, string> = {
  add: 'bg-ok-bg text-ok-foreground',
  del: 'bg-err-bg text-err-foreground',
  context: 'text-muted-foreground',
}
const PREFIX: Record<DiffLineType, string> = { add: '+', del: '-', context: ' ' }

export default function DiffTool() {
  const { t } = useTranslation('tools')
  const [original, setOriginal] = useState('')
  const [changed, setChanged] = useState('')

  const lines = useMemo(() => toDiffLines(original, changed), [original, changed])
  const stats = useMemo(() => diffStats(lines), [lines])
  const hasInput = original !== '' || changed !== ''

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CodePane
          label={t('diff.originalLabel')}
          value={original}
          onChange={setOriginal}
          placeholder={t('diff.originalPlaceholder')}
          rows="md"
          autoFocus
        />
        <CodePane
          label={t('diff.changedLabel')}
          value={changed}
          onChange={setChanged}
          placeholder={t('diff.changedPlaceholder')}
          rows="md"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xs uppercase tracking-wide text-muted-foreground">
          {t('diff.resultLabel')}
        </span>
        {hasInput ? (
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-ok-foreground">
              +{stats.added}
            </Badge>
            <Badge variant="outline" className="text-err-foreground">
              −{stats.removed}
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-md border bg-surface-1 font-mono text-sm">
        {hasInput ? (
          lines.map((line, i) => (
            <div key={i} className={cn('flex whitespace-pre px-3 py-px', LINE_STYLE[line.type])}>
              <span aria-hidden className="mr-3 select-none opacity-60">
                {PREFIX[line.type]}
              </span>
              <span>{line.text || ' '}</span>
            </div>
          ))
        ) : (
          <p className="px-3 py-10 text-center text-muted-foreground">{t('diff.empty')}</p>
        )}
      </div>
    </div>
  )
}
