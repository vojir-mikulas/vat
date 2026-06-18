import { useId } from 'react'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CopyButton } from '@/components/common/copy-button'

interface ResultFieldProps {
  label: string
  value: string
  mono?: boolean
  placeholder?: string
}

// Read-only single-line output with a label and a copy button — the building
// block for tools that emit several short values (hashes, color formats, …).
export function ResultField({ label, value, mono = true, placeholder }: ResultFieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-2xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          readOnly
          value={value}
          placeholder={placeholder}
          className={cn('bg-surface-1', mono && 'font-mono text-sm')}
        />
        <CopyButton value={value} />
      </div>
    </div>
  )
}
