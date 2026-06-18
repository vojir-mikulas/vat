import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'

import { extractPages, getPageCount, parsePageRange } from '@/lib/pdf'
import { downloadBytes, readFileBytes } from '@/lib/file-bytes'
import { useFileResult } from '@/lib/use-file-result'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dropzone } from '@/components/common/dropzone'

export default function PdfExtractTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [range, setRange] = useState('')
  const [busy, setBusy] = useState(false)
  const { result: pageCount } = useFileResult(file, getPageCount)

  const indices = pageCount ? parsePageRange(range, pageCount) : []

  async function download() {
    if (!file || indices.length === 0) return
    setBusy(true)
    try {
      const bytes = await readFileBytes(file)
      downloadBytes(await extractPages(bytes, indices), 'extracted.pdf', 'application/pdf')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        accept="application/pdf,.pdf"
        prompt={t('pdf-extract.prompt')}
        onFile={setFile}
        file={file}
      />

      {file && pageCount ? (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="pe-range"
            className="text-2xs uppercase tracking-wide text-muted-foreground"
          >
            {t('pdf-extract.range', { count: pageCount })}
          </Label>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              id="pe-range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder={t('pdf-extract.placeholder')}
              className="max-w-xs font-mono text-sm"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">
              {t('pdf-extract.selected', { count: indices.length })}
            </span>
            <Button className="ml-auto" onClick={download} disabled={busy || indices.length === 0}>
              <Download />
              {t('pdf-extract.download')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
