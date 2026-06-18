import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FORMAT_EXT, replaceExtension } from '@/lib/image'
import { useImageProcess } from '@/lib/use-image-process'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dropzone } from '@/components/common/dropzone'
import { ImageResult } from '@/components/common/image-result'
import { QualitySlider } from '@/components/common/quality-slider'

type CompressFormat = 'jpeg' | 'webp'
const FORMATS: { value: CompressFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
]

export default function ImageCompressTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<CompressFormat>('jpeg')
  const [quality, setQuality] = useState(0.7)

  const { result, error } = useImageProcess(file, { format, quality })

  return (
    <div className="flex flex-col gap-5">
      <Dropzone onFile={setFile} file={file} />

      {file ? (
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t('image-compress.format')}
            </span>
            <Select value={format} onValueChange={(v) => setFormat(v as CompressFormat)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <QualitySlider
            value={quality}
            onChange={setQuality}
            label={t('image-compress.quality')}
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}
      {result && file ? (
        <ImageResult
          result={result}
          filename={replaceExtension(file.name, FORMAT_EXT[format])}
          originalSize={file.size}
        />
      ) : null}
    </div>
  )
}
