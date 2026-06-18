import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react'

import { Button } from '@/components/ui/button'

const MIN_ZOOM = 0.02
const MAX_ZOOM = 8
// Breathing room (px) kept around the content when fitting it to the viewport.
const PAD = 96

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

interface ImageCanvasProps {
  src: string
  /** Intrinsic size (image px) of the content shown on the canvas. */
  contentW: number
  contentH: number
  /** Interaction layer drawn over the image, in the same box. Receives the zoom
   *  factor (display px per image px) so it can map pointer deltas to image px. */
  overlay?: (zoom: number) => React.ReactNode
  /** Small status chip drawn on the image itself (e.g. dimensions). */
  badge?: React.ReactNode
  /** Editing controls shown as the top toolbar bar. */
  toolbar?: React.ReactNode
  /** Read-out shown at the right of the bottom status bar (e.g. size). */
  status?: React.ReactNode
}

// A small image editor shell: a top toolbar, a scrollable + zoomable canvas (the
// image can be far larger than the window — pan with the scrollbars, zoom with the
// status-bar controls or ⌘/Ctrl + wheel, "fit" re-centers), and a bottom status
// bar. Tools layer their own interaction (crop box, handles) via `overlay`, which
// is positioned in the same coordinate space as the image.
export function ImageCanvas({
  src,
  contentW,
  contentH,
  overlay,
  badge,
  toolbar,
  status,
}: ImageCanvasProps) {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement>(null)
  const fitted = useRef(false)
  const [zoom, setZoom] = useState(1)

  // Zoom that fits the content inside the (padded) viewport; never upscales past
  // 100%, which would only blur the preview.
  function fitZoom(w: number, h: number) {
    const vp = viewportRef.current
    if (!vp || w <= 0 || h <= 0) return 1
    return clamp(Math.min((vp.clientWidth - PAD) / w, (vp.clientHeight - PAD) / h, 1), MIN_ZOOM, 1)
  }

  const setZoomClamped = (z: number) => setZoom(clamp(z, MIN_ZOOM, MAX_ZOOM))
  const fit = () => setZoomClamped(fitZoom(contentW, contentH))

  // ⌘/Ctrl + wheel zooms; plain wheel scrolls. Bound natively so the listener can
  // be non-passive and call preventDefault.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.1 : 0.9), MIN_ZOOM, MAX_ZOOM))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function onImageLoad() {
    // Fit once when the image first decodes (the viewport is measurable by then).
    if (fitted.current) return
    fitted.current = true
    setZoomClamped(fitZoom(contentW, contentH))
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-surface-1">
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b px-2 py-1.5">{toolbar}</div>
      ) : null}

      <div
        ref={viewportRef}
        className="h-[68vh] min-h-[26rem] overflow-auto"
        style={{
          backgroundImage: 'repeating-conic-gradient(var(--surface-2) 0% 25%, transparent 0% 50%)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="flex min-h-full min-w-full items-center justify-center p-12">
          <div
            className="relative shrink-0 select-none"
            style={{ width: Math.round(contentW * zoom), height: Math.round(contentH * zoom) }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              onLoad={onImageLoad}
              className="block size-full rounded-xs"
              style={{ objectFit: 'fill' }}
            />
            {badge}
            {overlay?.(zoom)}
          </div>
        </div>
      </div>

      {/* Status bar: zoom controls on the left, tool read-out on the right. */}
      <div className="flex items-center justify-between gap-2 border-t px-2 py-1">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" aria-label={t('image.fit')} onClick={fit}>
            <Maximize />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('image.zoomOut')}
            onClick={() => setZoomClamped(zoom / 1.25)}
          >
            <ZoomOut />
          </Button>
          <span className="w-11 text-center font-mono text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('image.zoomIn')}
            onClick={() => setZoomClamped(zoom * 1.25)}
          >
            <ZoomIn />
          </Button>
        </div>
        {status ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pr-1 text-xs text-muted-foreground">
            {status}
          </div>
        ) : null}
      </div>
    </div>
  )
}
