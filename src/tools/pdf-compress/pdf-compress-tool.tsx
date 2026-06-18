import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'

import { compressPdf } from '@/lib/pdf'
import { downloadBytes } from '@/lib/file-bytes'
import { formatBytes } from '@/lib/download'
import { useFileResult } from '@/lib/use-file-result'
import { replaceExtension } from '@/lib/image'
import { Button } from '@/components/ui/button'
import { Dropzone } from '@/components/common/dropzone'

export default function PdfCompressTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const { result, error } = useFileResult(file, compressPdf)

  const saved = file && result ? Math.round((1 - result.length / file.size) * 100) : null

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        accept="application/pdf,.pdf"
        prompt={t('pdf-compress.prompt')}
        onFile={setFile}
        file={file}
      />
      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}

      {file && result ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-surface-1 p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              {t('pdf-compress.before')}:{' '}
              <span className="font-mono">{formatBytes(file.size)}</span>
            </span>
            <span className="text-muted-foreground">
              {t('pdf-compress.after')}:{' '}
              <span className="font-mono">{formatBytes(result.length)}</span>
            </span>
            {saved !== null && saved > 0 ? (
              <span className="font-medium text-ok-foreground">−{saved}%</span>
            ) : (
              <span className="text-muted-foreground">{t('pdf-compress.noGain')}</span>
            )}
          </div>
          <p className="text-2xs text-muted-foreground">{t('pdf-compress.note')}</p>
          <div>
            <Button
              onClick={() =>
                downloadBytes(result, replaceExtension(file.name, 'pdf'), 'application/pdf')
              }
            >
              <Download />
              {t('pdf-compress.download')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
