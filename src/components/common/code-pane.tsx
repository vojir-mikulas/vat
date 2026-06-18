import { useId } from 'react'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CopyButton } from '@/components/common/copy-button'

interface CodePaneProps {
  label: string
  value: string
  /** Provide to make the pane an editable input; omit for a read-only output. */
  onChange?: (value: string) => void
  placeholder?: string
  /** Shown in place of the value and styled as an error (output panes). */
  error?: string | null
  /** Show a copy button in the pane header. */
  copy?: boolean
  autoFocus?: boolean
  /** Extra controls rendered in the pane header, right of the label. */
  headerActions?: React.ReactNode
  className?: string
  rows?: 'sm' | 'md' | 'lg'
}

const ROWS = { sm: 'min-h-32', md: 'min-h-56', lg: 'min-h-72' } as const

// Labeled monospace textarea — the shared input/output building block for text
// tools. Editable when `onChange` is given, otherwise a read-only output that can
// surface an error and offer a copy button.
export function CodePane({
  label,
  value,
  onChange,
  placeholder,
  error,
  copy,
  autoFocus,
  headerActions,
  className,
  rows = 'md',
}: CodePaneProps) {
  const id = useId()
  const readOnly = !onChange

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {/* Fixed height (= the copy button's h-8) so panes with and without a
          header button keep their textareas aligned on the same row. */}
      <div className="flex h-8 items-center justify-between gap-2">
        <Label htmlFor={id} className="text-2xs uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        <div className="flex items-center gap-1.5">
          {headerActions}
          {copy ? <CopyButton value={error ? '' : value} /> : null}
        </div>
      </div>
      <Textarea
        id={id}
        value={error ?? value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        autoFocus={autoFocus}
        spellCheck={false}
        className={cn(
          'resize-y font-mono text-sm',
          ROWS[rows],
          error && 'text-err',
          readOnly && 'bg-surface-1',
          className,
        )}
      />
    </div>
  )
}
