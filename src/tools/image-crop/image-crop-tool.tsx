import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { formatFromMime, type ProcessOptions } from '@/lib/image'
import { useImageInfo, useImageProcess } from '@/lib/use-image-process'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dropzone } from '@/components/common/dropzone'
import { ImageResult } from '@/components/common/image-result'

const toNum = (s: string) => {
  const n = Number(s)
  return s.trim() !== '' && n >= 0 ? n : undefined
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max))

export default function ImageCropTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [x, setX] = useState('')
  const [y, setY] = useState('')
  const [w, setW] = useState('')
  const [h, setH] = useState('')

  const info = useImageInfo(file)
  let crop: ProcessOptions['crop']
  if (info) {
    const nx = clamp(toNum(x) ?? 0, 0, info.naturalWidth - 1)
    const ny = clamp(toNum(y) ?? 0, 0, info.naturalHeight - 1)
    crop = {
      x: nx,
      y: ny,
      width: clamp(toNum(w) ?? info.naturalWidth - nx, 1, info.naturalWidth - nx),
      height: clamp(toNum(h) ?? info.naturalHeight - ny, 1, info.naturalHeight - ny),
    }
  }

  const opts: ProcessOptions = { format: file ? formatFromMime(file.type) : 'png', crop }
  const { result, error } = useImageProcess(file, opts)

  const FIELDS = [
    { id: 'cx', label: t('image-crop.x'), value: x, set: setX, max: info?.naturalWidth },
    { id: 'cy', label: t('image-crop.y'), value: y, set: setY, max: info?.naturalHeight },
    { id: 'cw', label: t('image-crop.width'), value: w, set: setW, max: info?.naturalWidth },
    { id: 'ch', label: t('image-crop.height'), value: h, set: setH, max: info?.naturalHeight },
  ]

  return (
    <div className="flex flex-col gap-5">
      <Dropzone onFile={setFile} file={file} />

      {file ? (
        <div className="flex flex-wrap items-end gap-4">
          {FIELDS.map((f) => (
            <div key={f.id} className="flex flex-col gap-2">
              <Label
                htmlFor={f.id}
                className="text-2xs uppercase tracking-wide text-muted-foreground"
              >
                {f.label}
              </Label>
              <Input
                id={f.id}
                type="number"
                min={0}
                max={f.max}
                value={f.value}
                placeholder={f.max ? String(f.max) : ''}
                onChange={(e) => f.set(e.target.value)}
                className="w-24"
              />
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}
      {result && file ? <ImageResult result={result} filename={file.name} /> : null}
    </div>
  )
}
