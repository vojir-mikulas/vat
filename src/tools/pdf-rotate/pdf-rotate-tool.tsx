import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, RotateCcw, RotateCw } from 'lucide-react'

import { getPageCount, rotatePdf } from '@/lib/pdf'
import { downloadBytes, readFileBytes } from '@/lib/file-bytes'
import { useFileResult } from '@/lib/use-file-result'
import { Button } from '@/components/ui/button'
import { Dropzone } from '@/components/common/dropzone'

export default function PdfRotateTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [angle, setAngle] = useState(0)
  const [busy, setBusy] = useState(false)
  const { result: pageCount } = useFileResult(file, getPageCount)

  const turn = (delta: number) => setAngle((a) => (((a + delta) % 360) + 360) % 360)

  async function download() {
    if (!file) return
    setBusy(true)
    try {
      const bytes = await readFileBytes(file)
      downloadBytes(await rotatePdf(bytes, angle), file.name, 'application/pdf')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        accept="application/pdf,.pdf"
        prompt={t('pdf-rotate.prompt')}
        onFile={setFile}
        file={file}
      />

      {file ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => turn(-90)}>
            <RotateCcw />
            {t('pdf-rotate.left')}
          </Button>
          <Button variant="outline" onClick={() => turn(90)}>
            <RotateCw />
            {t('pdf-rotate.right')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('pdf-rotate.angle', { angle })}
            {pageCount ? ` · ${t('pdf-rotate.allPages', { count: pageCount })}` : ''}
          </span>
          <Button className="ml-auto" onClick={download} disabled={busy}>
            <Download />
            {t('pdf-rotate.download')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
