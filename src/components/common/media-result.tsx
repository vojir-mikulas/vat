import { useTranslation } from 'react-i18next'
import { Download, Loader2 } from 'lucide-react'

import type { FfmpegPhase, MediaOutput } from '@/lib/use-ffmpeg'
import { downloadBlob, formatBytes } from '@/lib/download'
import { Button } from '@/components/ui/button'

// Loading/progress/error banner for an ffmpeg job.
export function FfmpegStatus({
  phase,
  progress,
  error,
}: {
  phase: FfmpegPhase
  progress: number
  error: string | null
}) {
  const { t } = useTranslation()
  if (phase === 'error') {
    return (
      <p className="rounded-lg border border-err-border bg-err-bg px-4 py-2.5 text-sm text-err-foreground">
        {error}
      </p>
    )
  }
  if (phase === 'loading' || phase === 'running') {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-surface-1 px-4 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {phase === 'loading' ? (
          <span>{t('media.loadingEngine')}</span>
        ) : (
          <span>
            {t('media.processing')} {progress > 0 ? `${progress}%` : ''}
          </span>
        )}
      </div>
    )
  }
  return null
}

export type MediaKind = 'video' | 'audio' | 'image'

// Output preview (video/audio/image) + size + download.
export function MediaResult({
  output,
  kind,
  filename,
}: {
  output: MediaOutput
  kind: MediaKind
  filename: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xs uppercase tracking-wide text-muted-foreground">
          {t('media.result')}
        </span>
        <Button onClick={() => downloadBlob(output.blob, filename)}>
          <Download />
          {t('media.download')}
        </Button>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-xl border bg-surface-1 p-4">
        {kind === 'video' ? (
          <video src={output.url} controls className="max-h-[26rem] max-w-full rounded-lg" />
        ) : kind === 'image' ? (
          <img src={output.url} alt={t('media.result')} className="max-h-[26rem] max-w-full" />
        ) : (
          <audio src={output.url} controls className="w-full" />
        )}
        <span className="font-mono text-sm text-muted-foreground">{formatBytes(output.size)}</span>
      </div>
    </div>
  )
}
