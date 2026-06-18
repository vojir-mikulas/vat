import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'

import { aspectDimensions, formatFromMime, type ProcessOptions } from '@/lib/image'
import { useImageInfo, useImageProcess } from '@/lib/use-image-process'
import { downloadBlob, formatBytes } from '@/lib/download'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dropzone } from '@/components/common/dropzone'

const toNum = (s: string) => {
  const n = Number(s)
  return s.trim() !== '' && n > 0 ? n : undefined
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

export default function ImageResizeTool() {
  const { t } = useTranslation('tools')
  const { t: tc } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lock, setLock] = useState(true)

  // Reset the dimension inputs when a new file is loaded (render-time reset, the
  // React-recommended alternative to a synchronizing effect).
  const [prevFile, setPrevFile] = useState(file)
  if (file !== prevFile) {
    setPrevFile(file)
    setWidth('')
    setHeight('')
  }

  const info = useImageInfo(file)
  const ratio = info ? info.naturalWidth / info.naturalHeight : 1

  // Object URL for the live drag preview (cheap CSS scaling, no re-encode).
  const srcUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => void (srcUrl && URL.revokeObjectURL(srcUrl)), [srcUrl])

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

  const effW = resize?.width ?? info?.naturalWidth ?? 0
  const effH = resize?.height ?? info?.naturalHeight ?? 0

  // When the aspect ratio is locked, editing one dimension forces the other so the
  // ratio is preserved as you type (not just when resizing by drag).
  function changeWidth(v: string) {
    setWidth(v)
    if (lock) {
      const n = toNum(v)
      setHeight(n ? String(Math.round(n / ratio)) : '')
    }
  }
  function changeHeight(v: string) {
    setHeight(v)
    if (lock) {
      const n = toNum(v)
      setWidth(n ? String(Math.round(n * ratio)) : '')
    }
  }

  // Turning the lock on snaps the current dimensions back to the natural ratio.
  function changeLock(next: boolean) {
    setLock(next)
    if (next) {
      const w = toNum(width)
      const h = toNum(height)
      if (w) setHeight(String(Math.round(w / ratio)))
      else if (h) setWidth(String(Math.round(h * ratio)))
    }
  }

  // Drag commits once on release, so the encode runs once — not on every move.
  function commitDrag(w: number, h: number) {
    setWidth(String(w))
    setHeight(String(h))
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone onFile={setFile} file={file} />

      {file && info && srcUrl ? (
        <>
          <ResizeFrame
            src={srcUrl}
            resultUrl={result?.url}
            natW={info.naturalWidth}
            natH={info.naturalHeight}
            width={effW}
            height={effH}
            lock={lock}
            handleLabel={t('image-resize.handle')}
            onCommit={commitDrag}
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{tc('image.dimensions', { width: effW, height: effH })}</span>
                  {result ? (
                    <span className="font-mono">{formatBytes(result.blob.size)}</span>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  disabled={!result}
                  onClick={() => result && downloadBlob(result.blob, file.name)}
                >
                  <Download />
                  {tc('image.download')}
                </Button>
              </div>
            }
          />
          <p className="text-xs text-muted-foreground">{t('image-resize.dragHint')}</p>

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
                placeholder={String(info.naturalWidth)}
                onChange={(e) => changeWidth(e.target.value)}
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
                value={height}
                placeholder={String(info.naturalHeight)}
                onChange={(e) => changeHeight(e.target.value)}
                className="w-28"
              />
            </div>
            <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
              <Switch checked={lock} onCheckedChange={changeLock} />
              {t('image-resize.lockAspect')}
            </Label>
          </div>
        </>
      ) : null}

      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}
    </div>
  )
}

interface ResizeFrameProps {
  src: string
  /** Encoded output URL, shown when idle so the preview IS the final result. */
  resultUrl?: string
  natW: number
  natH: number
  width: number
  height: number
  lock: boolean
  handleLabel: string
  footer: React.ReactNode
  /** Called once with the final dimensions when a drag ends. */
  onCommit: (width: number, height: number) => void
}

const MAX_W = 560
const MAX_H = 380

// Interactive preview that doubles as the result card: the image scaled to its
// target size with a corner handle to drag-resize it. While dragging it scales the
// source via CSS (no re-encode) and commits once on release; when idle it shows the
// encoded output. Precise or upscaled values still go through the number inputs.
function ResizeFrame({
  src,
  resultUrl,
  natW,
  natH,
  width,
  height,
  lock,
  handleLabel,
  footer,
  onCommit,
}: ResizeFrameProps) {
  // Display px per image px — fits the natural image into the preview box.
  const scale = Math.min(MAX_W / natW, MAX_H / natH, 1)
  const drag = useRef<{
    x: number
    y: number
    w: number
    h: number
    lastW: number
    lastH: number
  } | null>(null)
  // Non-null only while dragging — holds the live (uncommitted) dimensions.
  const [live, setLive] = useState<{ w: number; h: number } | null>(null)

  const dispW = live ? live.w : width
  const dispH = live ? live.h : height

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, w: width, h: height, lastW: width, lastH: height }
    setLive({ w: width, h: height })
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    const w = clamp(Math.round(d.w + (e.clientX - d.x) / scale), 16, natW)
    const h = lock
      ? Math.round(w / (natW / natH))
      : clamp(Math.round(d.h + (e.clientY - d.y) / scale), 16, natH)
    d.lastW = w
    d.lastH = h
    setLive({ w, h })
  }

  function endDrag() {
    const d = drag.current
    if (!d) return
    drag.current = null
    setLive(null)
    onCommit(d.lastW, d.lastH)
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-surface-1">
      <div
        className="flex items-center justify-center p-8"
        style={{
          backgroundImage: 'repeating-conic-gradient(var(--surface-2) 0% 25%, transparent 0% 50%)',
          backgroundSize: '20px 20px',
        }}
      >
        <div
          className="relative select-none"
          style={{ width: Math.round(dispW * scale), height: Math.round(dispH * scale) }}
        >
          <img
            // Show the source while dragging (smooth CSS scaling); the encoded
            // result when idle, so what you see is exactly what downloads.
            src={live ? src : (resultUrl ?? src)}
            alt=""
            draggable={false}
            className="block size-full rounded-xs"
            style={{ objectFit: 'fill' }}
          />
          <span className="absolute left-1 top-1 rounded bg-background/85 px-1.5 py-0.5 font-mono text-xs text-foreground shadow-sm">
            {dispW} × {dispH}
          </span>
          <button
            type="button"
            aria-label={handleLabel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="absolute -bottom-1.5 -right-1.5 size-4 cursor-nwse-resize touch-none rounded-sm border-2 border-background bg-brand shadow-sm"
          />
        </div>
      </div>
      {footer}
    </div>
  )
}
