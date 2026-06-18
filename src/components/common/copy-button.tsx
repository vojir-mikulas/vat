import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  /** Text to copy. If empty/undefined the button is disabled. */
  value: string | undefined
  className?: string
  size?: React.ComponentProps<typeof Button>['size']
  variant?: React.ComponentProps<typeof Button>['variant']
  /** Optional label; defaults to icon-only. */
  label?: string
}

// Copy-to-clipboard with a transient "Copied" state. Falls back to a toast hint
// when the Clipboard API is unavailable or denied (e.g. insecure context).
export function CopyButton({
  value,
  className,
  size = 'sm',
  variant = 'outline',
  label,
}: CopyButtonProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t('toast.copyFailed'))
    }
  }

  return (
    <Button
      type="button"
      size={label ? size : (`icon-${size}` as 'icon-sm')}
      variant={variant}
      disabled={!value}
      onClick={onCopy}
      aria-label={label ?? t('actions.copy')}
      className={cn(className)}
    >
      {copied ? <Check className="text-ok" /> : <Copy />}
      {label ? <span>{copied ? t('actions.copied') : label}</span> : null}
    </Button>
  )
}
