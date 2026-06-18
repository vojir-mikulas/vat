import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Crop,
  Download,
  FlipHorizontal,
  FlipVertical,
  Lock,
  RotateCcw,
  RotateCw,
  Scaling,
  Undo2,
} from 'lucide-react'

import {
  displayDimensions,
  displayRectToSource,
  formatFromMime,
  isSvg,
  rasterizeSvg,
  type ProcessOptions,
  type Rotation,
} from '@/lib/image'
import { useImageInfo, useImageProcess } from '@/lib/use-image-process'
import { downloadBlob, formatBytes } from '@/lib/download'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Dropzone } from '@/components/common/dropzone'
import { ImageCanvas } from '@/components/common/image-canvas'
import { CropBox, type Rect } from '@/components/common/crop-box'

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)
// How far the resize tool may upscale, as a multiple of the (cropped) source.
const MAX_SCALE = 16

interface Size {
  w: number
  h: number
}

type Tool = 'crop' | 'resize'

// A combined image editor with two tools — Crop and Resize — plus rotate/flip,
// in one cohesive workspace. The canvas shows the image in its current
// orientation; the crop box is drawn in that displayed space and mapped back to
// source pixels for the pipeline (crop → resize → rotate). Resize can scale up.
export default function ImageEditorTool() {
  const { t } = useTranslation('tools')
  const { t: tc } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [tool, setTool] = useState<Tool>('crop')
  const [rotate, setRotate] = useState<Rotation>(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [cropD, setCropD] = useState<Rect | null>(null)
  // Output size in displayed orientation. null ⇒ track the crop (no scaling).
  const [out, setOut] = useState<Size | null>(null)
  const [lock, setLock] = useState(true)
  // Non-null only while dragging the resize handle (uncommitted, visual only).
  const [liveOut, setLiveOut] = useState<Size | null>(null)
  const rdrag = useRef<{
    x: number
    y: number
    startW: number
    startH: number
    lastW: number
    lastH: number
  } | null>(null)

  const info = useImageInfo(file)
  const sw = info?.naturalWidth ?? 0
  const sh = info?.naturalHeight ?? 0
  const display = displayDimensions(sw, sh, rotate)
  const swap = rotate === 90 || rotate === 270

  // Reset on a new file; (re)seed the crop to the whole image once measured. Both
  // are guarded render-time updates (not effects); seeding keys off the info object
  // so it reseeds even while useImageInfo briefly reports the previous image.
  const [prevFile, setPrevFile] = useState(file)
  if (file !== prevFile) {
    setPrevFile(file)
    setRotate(0)
    setFlipH(false)
    setFlipV(false)
    setCropD(null)
    setOut(null)
    setLiveOut(null)
  }
  const [seededFor, setSeededFor] = useState(info)
  if (info && info !== seededFor) {
    setSeededFor(info)
    setCropD({ x: 0, y: 0, w: info.naturalWidth, h: info.naturalHeight })
  }

  const srcUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => void (srcUrl && URL.revokeObjectURL(srcUrl)), [srcUrl])

  const format = file ? formatFromMime(file.type) : 'png'

  // Reoriented full image for the Crop view — re-encoded only on orientation
  // change, so cropping stays smooth.
  const preview = useImageProcess(file, { format, rotate, flipH, flipV })

  // Effective output size: live drag → committed resize → tracks the crop.
  const cropSize: Size = cropD ? { w: cropD.w, h: cropD.h } : { w: 0, h: 0 }
  const effOut = liveOut ?? out ?? cropSize
  const outW = Math.round(effOut.w)
  const outH = Math.round(effOut.h)

  const cropSrc =
    cropD && info
      ? displayRectToSource(
          { x: cropD.x, y: cropD.y, width: cropD.w, height: cropD.h },
          sw,
          sh,
          rotate,
          flipH,
          flipV,
        )
      : null
  const isFullCrop =
    !cropD ||
    (cropD.x <= 0 && cropD.y <= 0 && cropD.w >= display.width && cropD.h >= display.height)
  // Resize feeds the pipeline pre-rotation, so un-swap the displayed output size.
  const resized = out && cropD && (out.w !== cropD.w || out.h !== cropD.h)
  const outputOpts: ProcessOptions = {
    format,
    rotate,
    flipH,
    flipV,
    crop: isFullCrop || !cropSrc ? undefined : cropSrc,
    resize:
      resized && out
        ? swap
          ? { width: Math.round(out.h), height: Math.round(out.w) }
          : { width: Math.round(out.w), height: Math.round(out.h) }
        : undefined,
  }
  const { result, error } = useImageProcess(file, outputOpts)

  function turn(delta: number) {
    const next = ((((rotate + delta) % 360) + 360) % 360) as Rotation
    setRotate(next)
    const d = displayDimensions(sw, sh, next)
    setCropD({ x: 0, y: 0, w: d.width, h: d.height }) // dimensions swap, so re-seed
    setOut(null)
  }

  function reset() {
    setRotate(0)
    setFlipH(false)
    setFlipV(false)
    setCropD({ x: 0, y: 0, w: sw, h: sh })
    setOut(null)
    setLiveOut(null)
  }

  // Cropping re-tracks the output size to the new crop.
  function changeCrop(r: Rect) {
    setCropD(r)
    setOut(null)
  }

  function setOutW(v: string) {
    const n = Number(v)
    if (v.trim() === '' || n <= 0 || !cropD) return
    const w = clamp(n, 1, cropD.w * MAX_SCALE)
    setOut({ w, h: lock ? Math.max(1, Math.round((w * cropD.h) / cropD.w)) : outH })
  }
  function setOutH(v: string) {
    const n = Number(v)
    if (v.trim() === '' || n <= 0 || !cropD) return
    const h = clamp(n, 1, cropD.h * MAX_SCALE)
    setOut({ w: lock ? Math.max(1, Math.round((h * cropD.w) / cropD.h)) : outW, h })
  }

  // SVGs are vector and have no fixed pixel size, so the canvas pipeline can't
  // edit them directly — rasterize to PNG on import (fall back to the raw file).
  function pickFile(f: File) {
    if (isSvg(f)) rasterizeSvg(f).then(setFile, () => setFile(f))
    else setFile(f)
  }

  const inputCls = 'h-8 w-24 text-sm tabular-nums'

  return (
    <div className="flex flex-col gap-5">
      <Dropzone onFile={pickFile} file={file} />

      {file && info && srcUrl && cropD ? (
        <ImageCanvas
          // Remount (and re-fit) when the file or active tool changes.
          key={`${srcUrl}:${tool}`}
          src={
            tool === 'resize'
              ? (result?.url ?? preview.result?.url ?? srcUrl)
              : (preview.result?.url ?? srcUrl)
          }
          contentW={tool === 'resize' ? outW : display.width}
          contentH={tool === 'resize' ? outH : display.height}
          overlay={(zoom) =>
            tool === 'crop' ? (
              <CropBox
                natW={display.width}
                natH={display.height}
                rect={cropD}
                zoom={zoom}
                moveLabel={t('image-editor.move')}
                cornerLabel={t('image-editor.corner')}
                onChange={changeCrop}
              />
            ) : (
              <button
                type="button"
                aria-label={t('image-editor.handle')}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.currentTarget.setPointerCapture(e.pointerId)
                  rdrag.current = {
                    x: e.clientX,
                    y: e.clientY,
                    startW: outW,
                    startH: outH,
                    lastW: outW,
                    lastH: outH,
                  }
                  setLiveOut({ w: outW, h: outH })
                }}
                onPointerMove={(e) => {
                  const d = rdrag.current
                  if (!d) return
                  const w = clamp(
                    Math.round(d.startW + (e.clientX - d.x) / zoom),
                    16,
                    cropD.w * MAX_SCALE,
                  )
                  const h = lock
                    ? Math.max(16, Math.round((w * cropD.h) / cropD.w))
                    : clamp(
                        Math.round(d.startH + (e.clientY - d.y) / zoom),
                        16,
                        cropD.h * MAX_SCALE,
                      )
                  d.lastW = w
                  d.lastH = h
                  setLiveOut({ w, h })
                }}
                onPointerUp={() => {
                  const d = rdrag.current
                  if (!d) return
                  rdrag.current = null
                  setOut({ w: d.lastW, h: d.lastH }) // commit once → one encode
                  setLiveOut(null)
                }}
                onPointerCancel={() => {
                  rdrag.current = null
                  setLiveOut(null)
                }}
                className="absolute -bottom-1.5 -right-1.5 size-4 cursor-nwse-resize touch-none rounded-sm border-2 border-background bg-brand shadow-sm"
              />
            )
          }
          toolbar={
            <>
              {/* Tool selector */}
              <Button
                variant={tool === 'crop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('crop')}
              >
                <Crop />
                {t('image-editor.crop')}
              </Button>
              <Button
                variant={tool === 'resize' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('resize')}
              >
                <Scaling />
                {t('image-editor.resize')}
              </Button>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <Button
                variant="outline"
                size="icon-sm"
                aria-label={t('image-editor.rotateLeft')}
                onClick={() => turn(-90)}
              >
                <RotateCcw />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={t('image-editor.rotateRight')}
                onClick={() => turn(90)}
              >
                <RotateCw />
              </Button>
              <Button
                variant={flipH ? 'default' : 'outline'}
                size="icon-sm"
                aria-label={t('image-editor.flipH')}
                onClick={() => setFlipH((v) => !v)}
              >
                <FlipHorizontal />
              </Button>
              <Button
                variant={flipV ? 'default' : 'outline'}
                size="icon-sm"
                aria-label={t('image-editor.flipV')}
                onClick={() => setFlipV((v) => !v)}
              >
                <FlipVertical />
              </Button>

              {/* Resize-only: output dimensions + aspect lock */}
              {tool === 'resize' ? (
                <>
                  <Separator orientation="vertical" className="mx-1 h-6" />
                  <Input
                    type="number"
                    min={1}
                    value={outW}
                    aria-label={t('image-editor.width')}
                    onChange={(e) => setOutW(e.target.value)}
                    className={inputCls}
                  />
                  <span className="text-xs text-muted-foreground">×</span>
                  <Input
                    type="number"
                    min={1}
                    value={outH}
                    aria-label={t('image-editor.height')}
                    onChange={(e) => setOutH(e.target.value)}
                    className={inputCls}
                  />
                  <Button
                    variant={lock ? 'default' : 'outline'}
                    size="icon-sm"
                    aria-label={t('image-editor.lockAspect')}
                    aria-pressed={lock}
                    onClick={() => setLock((v) => !v)}
                  >
                    <Lock />
                  </Button>
                </>
              ) : null}

              <Separator orientation="vertical" className="mx-1 h-6" />

              <Button variant="ghost" size="sm" onClick={reset}>
                <Undo2 />
                {t('image-editor.reset')}
              </Button>

              <Button
                size="sm"
                className="ml-auto"
                disabled={!result}
                onClick={() => result && downloadBlob(result.blob, file.name)}
              >
                <Download />
                {tc('image.download')}
              </Button>
            </>
          }
          status={
            <>
              <span>{tc('image.dimensions', { width: outW, height: outH })}</span>
              {result ? <span className="font-mono">{formatBytes(result.blob.size)}</span> : null}
            </>
          }
        />
      ) : null}

      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}
    </div>
  )
}
