import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { formatFromMime, isLossy, type ProcessOptions } from '@/lib/image'
import { useImageProcess } from '@/lib/use-image-process'
import { Dropzone } from '@/components/common/dropzone'
import { ImageResult } from '@/components/common/image-result'

// Re-encoding through a canvas drops all embedded metadata (EXIF, GPS, color
// profiles), so "remove EXIF" is just a same-format re-export. Lossy formats use
// a high quality to keep the re-encode visually lossless.
export default function ImageExifTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)

  const format = file ? formatFromMime(file.type) : 'png'
  const opts: ProcessOptions = { format, quality: isLossy(format) ? 0.95 : undefined }
  const { result, error } = useImageProcess(file, opts)

  return (
    <div className="flex flex-col gap-5">
      <Dropzone onFile={setFile} file={file} />

      {result && file ? (
        <p className="rounded-lg border border-ok-border bg-ok-bg px-4 py-2.5 text-sm text-ok-foreground">
          {t('image-exif.done')}
        </p>
      ) : null}

      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}
      {result && file ? <ImageResult result={result} filename={file.name} /> : null}
    </div>
  )
}
