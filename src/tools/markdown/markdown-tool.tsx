import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { renderMarkdown } from './markdown'

const SAMPLE = `# Hello

Type **Markdown** on the left and see it _rendered_ here.

- Lists
- [Links](https://example.com)
- \`inline code\`

> Blockquotes too.
`

export default function MarkdownTool() {
  const { t } = useTranslation('tools')
  const [input, setInput] = useState(SAMPLE)
  const html = useMemo(() => renderMarkdown(input), [input])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-2">
        <Label
          htmlFor="md-input"
          className="text-2xs uppercase tracking-wide text-muted-foreground"
        >
          {t('markdown.inputLabel')}
        </Label>
        <Textarea
          id="md-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('markdown.inputPlaceholder')}
          spellCheck={false}
          className="min-h-72 resize-y font-mono text-sm"
          autoFocus
        />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-2xs uppercase tracking-wide text-muted-foreground">
          {t('markdown.previewLabel')}
        </span>
        {/* html is sanitized by DOMPurify in renderMarkdown(). */}
        <div
          className="markdown-body min-h-72 overflow-auto rounded-md border bg-surface-1 px-4 py-3 text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
