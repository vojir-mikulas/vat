import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileArchive } from 'lucide-react'

import { splitPdfPages } from '@/lib/pdf'
import { createZip } from '@/tools/zip/zip'
import { downloadBytes } from '@/lib/file-bytes'
import { useFileResult } from '@/lib/use-file-result'
import { Button } from '@/components/ui/button'
import { Dropzone } from '@/components/common/dropzone'
import { FileList, type FileEntry } from '@/components/common/file-list'

export default function PdfSplitTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const { result, error } = useFileResult(file, splitPdfPages)

  const entries: FileEntry[] | null =
    result?.map((data, i) => ({ name: `page-${i + 1}.pdf`, data })) ?? null

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        accept="application/pdf,.pdf"
        prompt={t('pdf-split.prompt')}
        onFile={setFile}
        file={file}
      />
      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}

      {entries ? (
        <>
          <div className="flex justify-end">
            <Button
              onClick={() => downloadBytes(createZip(entries), 'pages.zip', 'application/zip')}
            >
              <FileArchive />
              {t('pdf-split.downloadZip')}
            </Button>
          </div>
          <FileList entries={entries} />
        </>
      ) : null}
    </div>
  )
}
