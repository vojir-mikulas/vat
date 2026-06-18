import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { aspectDimensions, formatFromMime, type ProcessOptions } from '@/lib/image'
import { useImageInfo, useImageProcess } from '@/lib/use-image-process'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dropzone } from '@/components/common/dropzone'
import { ImageResult } from '@/components/common/image-result'

const toNum = (s: string) => {
  const n = Number(s)
  return s.trim() !== '' && n > 0 ? n : undefined
}

export default function ImageResizeTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lock, setLock] = useState(true)

  const info = useImageInfo(file)
  const resize =
    info && (toNum(width) || toNum(height))
      ? aspectDimensions(
          info.naturalWidth,
          info.naturalHeight,
          { width: toNum(width), height: toNum(height) },
          lock,
        )
      : undefined

  const opts: ProcessOptions = { format: file ? formatFromMime(file.type) : 'png', resize }
  const { result, error } = useImageProcess(file, opts)

  return (
    <div className="flex flex-col gap-5">
      <Dropzone onFile={setFile} file={file} />

      {file ? (
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="rz-w"
              className="text-2xs uppercase tracking-wide text-muted-foreground"
            >
              {t('image-resize.width')}
            </Label>
            <Input
              id="rz-w"
              type="number"
              min={1}
              value={width}
              placeholder={info ? String(info.naturalWidth) : ''}
              onChange={(e) => setWidth(e.target.value)}
              className="w-28"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="rz-h"
              className="text-2xs uppercase tracking-wide text-muted-foreground"
            >
              {t('image-resize.height')}
            </Label>
            <Input
              id="rz-h"
              type="number"
              min={1}
              value={lock ? '' : height}
              disabled={lock}
              placeholder={info ? String(info.naturalHeight) : ''}
              onChange={(e) => setHeight(e.target.value)}
              className="w-28"
            />
          </div>
          <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
            <Switch checked={lock} onCheckedChange={setLock} />
            {t('image-resize.lockAspect')}
          </Label>
        </div>
      ) : null}

      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}
      {result && file ? <ImageResult result={result} filename={file.name} /> : null}
    </div>
  )
}
