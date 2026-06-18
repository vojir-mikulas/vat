import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import jsQR from 'jsqr'

import { loadImageFromFile } from '@/lib/image'
import { Dropzone } from '@/components/common/dropzone'
import { CodePane } from '@/components/common/code-pane'

export default function QrReadTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [decoded, setDecoded] = useState<{ text: string | null } | null>(null)

  useEffect(() => {
    if (!file) return
    let active = true
    void (async () => {
      const img = await loadImageFromFile(file)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(data, width, height)
      if (active) setDecoded({ text: code ? code.data : null })
    })().catch(() => {
      if (active) setDecoded({ text: null })
    })
    return () => {
      active = false
    }
  }, [file])

  return (
    <div className="flex flex-col gap-5">
      <Dropzone accept="image/*" prompt={t('qr-read.prompt')} onFile={setFile} file={file} />

      {decoded?.text ? (
        <CodePane label={t('qr-read.result')} value={decoded.text} copy rows="sm" />
      ) : decoded && decoded.text === null ? (
        <p className="rounded-lg border border-warn-border bg-warn-bg px-4 py-2.5 text-sm text-warn-foreground">
          {t('qr-read.notFound')}
        </p>
      ) : null}
    </div>
  )
}
