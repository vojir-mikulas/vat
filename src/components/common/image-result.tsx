import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'

import type { ProcessResult } from '@/lib/image'
import { downloadBlob, formatBytes } from '@/lib/download'
import { Button } from '@/components/ui/button'

interface ImageResultProps {
  result: ProcessResult
  filename: string
  /** Original byte size, to show a before/after comparison (e.g. compress). */
  originalSize?: number
}

// Result preview for image tools: the processed image, its dimensions and size
// (optionally vs the original), a fallback notice, and a download button.
export function ImageResult({ result, filename, originalSize }: ImageResultProps) {
  const { t } = useTranslation()
  const delta =
    originalSize && originalSize > 0
      ? Math.round((1 - result.blob.size / originalSize) * 100)
      : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-2xs uppercase tracking-wide text-muted-foreground">
          {t('image.result')}
        </span>
        <Button onClick={() => downloadBlob(result.blob, filename)}>
          <Download />
          {t('image.download')}
        </Button>
      </div>

      {result.formatFallback ? (
        <p className="rounded-lg border border-warn-border bg-warn-bg px-4 py-2.5 text-sm text-warn-foreground">
          {t('image.formatUnsupported')}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-surface-1">
        <div
          className="flex max-h-[28rem] items-center justify-center p-4"
          style={{
            backgroundImage:
              'repeating-conic-gradient(var(--surface-2) 0% 25%, transparent 0% 50%)',
            backgroundSize: '20px 20px',
          }}
        >
          <img
            src={result.url}
            alt={t('image.result')}
            className="max-h-[26rem] max-w-full object-contain"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2.5 text-sm text-muted-foreground">
          <span>{t('image.dimensions', { width: result.width, height: result.height })}</span>
          <span className="font-mono">{formatBytes(result.blob.size)}</span>
          {delta !== null ? (
            <span className={delta > 0 ? 'text-ok-foreground' : 'text-muted-foreground'}>
              {delta > 0 ? `−${delta}%` : `+${Math.abs(delta)}%`}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
