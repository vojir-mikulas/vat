import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlipHorizontal, FlipVertical, RotateCcw, RotateCw } from 'lucide-react'

import { formatFromMime, type ProcessOptions } from '@/lib/image'
import { useImageProcess } from '@/lib/use-image-process'
import { Button } from '@/components/ui/button'
import { Dropzone } from '@/components/common/dropzone'
import { ImageResult } from '@/components/common/image-result'

type Rotation = 0 | 90 | 180 | 270

export default function ImageRotateTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [rotate, setRotate] = useState<Rotation>(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)

  const opts: ProcessOptions = {
    format: file ? formatFromMime(file.type) : 'png',
    rotate,
    flipH,
    flipV,
  }
  const { result, error } = useImageProcess(file, opts)

  const turn = (delta: number) => setRotate((r) => (((r + delta) % 360) + 360) as Rotation)

  return (
    <div className="flex flex-col gap-5">
      <Dropzone onFile={setFile} file={file} />

      {file ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => turn(-90)}>
            <RotateCcw />
            {t('image-rotate.left')}
          </Button>
          <Button variant="outline" onClick={() => turn(90)}>
            <RotateCw />
            {t('image-rotate.right')}
          </Button>
          <Button variant={flipH ? 'default' : 'outline'} onClick={() => setFlipH((v) => !v)}>
            <FlipHorizontal />
            {t('image-rotate.flipH')}
          </Button>
          <Button variant={flipV ? 'default' : 'outline'} onClick={() => setFlipV((v) => !v)}>
            <FlipVertical />
            {t('image-rotate.flipV')}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}
      {result && file ? <ImageResult result={result} filename={file.name} /> : null}
    </div>
  )
}
