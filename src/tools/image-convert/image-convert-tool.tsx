import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FORMAT_EXT, IMAGE_FORMATS, isLossy, replaceExtension, type ImageFormat } from '@/lib/image'
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

const FORMAT_LABELS: Record<ImageFormat, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
  avif: 'AVIF',
}

export default function ImageConvertTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<ImageFormat>('png')
  const [quality, setQuality] = useState(0.9)

  const { result, error } = useImageProcess(file, {
    format,
    quality: isLossy(format) ? quality : undefined,
  })

  return (
    <div className="flex flex-col gap-5">
      <Dropzone onFile={setFile} file={file} />

      {file ? (
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t('image-convert.format')}
            </span>
            <Select value={format} onValueChange={(v) => setFormat(v as ImageFormat)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isLossy(format) ? (
            <QualitySlider
              value={quality}
              onChange={setQuality}
              label={t('image-convert.quality')}
            />
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}
      {result && file ? (
        <ImageResult result={result} filename={replaceExtension(file.name, FORMAT_EXT[format])} />
      ) : null}
    </div>
  )
}
