import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Download } from 'lucide-react'

import { formatTimecode } from '@/lib/ffmpeg-args'
import { replaceExtension } from '@/lib/image'
import { downloadBlob, formatBytes } from '@/lib/download'
import { useObjectUrl } from '@/lib/use-object-url'
import { Button } from '@/components/ui/button'
import { Dropzone } from '@/components/common/dropzone'
import { VideoPlayer, type VideoPlayerHandle } from '@/components/common/video-player'

interface Capture {
  url: string
  blob: Blob
  time: number
}

// Scrub the video and grab the current frame directly off the <video> element via
// canvas — instant, and no ffmpeg/WASM needed since an object-URL source is
// same-origin (untainted).
export default function VideoFrameTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const url = useObjectUrl(file)
  const playerRef = useRef<VideoPlayerHandle>(null)
  const [capture, setCapture] = useState<Capture | null>(null)
  const lastUrl = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current)
    },
    [],
  )

  function grabFrame() {
    const v = playerRef.current?.video
    if (!v || !v.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(v, 0, 0)
    const time = v.currentTime
    canvas.toBlob((blob) => {
      if (!blob) return
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current)
      const u = URL.createObjectURL(blob)
      lastUrl.current = u
      setCapture({ url: u, blob, time })
    }, 'image/png')
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        accept="video/*"
        prompt={t('video-frame.prompt')}
        file={file}
        onFile={(f) => {
          setFile(f)
          setCapture(null)
        }}
      />

      {url ? (
        <VideoPlayer
          key={url}
          ref={playerRef}
          src={url}
          actions={
            <Button
              variant="brand"
              size="sm"
              onClick={grabFrame}
              className="ml-1 h-8 hover:bg-brand/90"
            >
              <Camera />
              {t('video-frame.capture')}
            </Button>
          }
        />
      ) : null}

      {capture && file ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t('video-frame.result')} · {formatTimecode(capture.time)}
            </span>
            <Button
              onClick={() =>
                downloadBlob(
                  capture.blob,
                  replaceExtension(file.name, 'png').replace(
                    /\.png$/,
                    `-${Math.round(capture.time)}s.png`,
                  ),
                )
              }
            >
              <Download />
              {t('video-frame.download')}
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border bg-surface-1">
            <img
              src={capture.url}
              alt={t('video-frame.result')}
              className="max-h-[24rem] w-full object-contain"
            />
            <div className="border-t px-4 py-2 font-mono text-sm text-muted-foreground">
              {formatBytes(capture.blob.size)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
