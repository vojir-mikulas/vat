import { useRef } from 'react'

import { cn } from '@/lib/utils'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max))
const MIN_CROP = 16

// The four resize anchors — direction key (n/s + e/w) plus where each sits on the
// crop box and which diagonal-resize cursor it shows.
const CORNERS = [
  { key: 'nw', pos: '-left-1.5 -top-1.5', cursor: 'cursor-nwse-resize' },
  { key: 'ne', pos: '-right-1.5 -top-1.5', cursor: 'cursor-nesw-resize' },
  { key: 'sw', pos: '-bottom-1.5 -left-1.5', cursor: 'cursor-nesw-resize' },
  { key: 'se', pos: '-bottom-1.5 -right-1.5', cursor: 'cursor-nwse-resize' },
] as const

interface CropBoxProps {
  /** Bounds the crop can occupy, in the same (image px) space as `rect`. */
  natW: number
  natH: number
  rect: Rect
  /** Display px per image px, to convert pointer deltas to image px. */
  zoom: number
  moveLabel: string
  cornerLabel: string
  onChange: (rect: Rect) => void
}

// Draggable crop rectangle drawn over an image: drag the body to move it, the
// corners to resize. All math is in image px (pointer delta ÷ zoom); the box dims
// everything outside it with a large box-shadow.
export function CropBox({
  natW,
  natH,
  rect,
  zoom,
  moveLabel,
  cornerLabel,
  onChange,
}: CropBoxProps) {
  const drag = useRef<{ mode: string; x: number; y: number; rect: Rect } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    // A corner anchor sets data-handle; pressing the body falls back to "move".
    const mode = (e.target as HTMLElement).dataset.handle ?? 'move'
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { mode, x: e.clientX, y: e.clientY, rect: { ...rect } }
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    const dx = Math.round((e.clientX - d.x) / zoom)
    const dy = Math.round((e.clientY - d.y) / zoom)
    let { x, y, w, h } = d.rect

    if (d.mode === 'move') {
      x = clamp(d.rect.x + dx, 0, natW - w)
      y = clamp(d.rect.y + dy, 0, natH - h)
    } else {
      if (d.mode.includes('w')) {
        const nx = clamp(d.rect.x + dx, 0, d.rect.x + d.rect.w - MIN_CROP)
        w = d.rect.w + (d.rect.x - nx)
        x = nx
      }
      if (d.mode.includes('e')) w = clamp(d.rect.w + dx, MIN_CROP, natW - d.rect.x)
      if (d.mode.includes('n')) {
        const ny = clamp(d.rect.y + dy, 0, d.rect.y + d.rect.h - MIN_CROP)
        h = d.rect.h + (d.rect.y - ny)
        y = ny
      }
      if (d.mode.includes('s')) h = clamp(d.rect.h + dy, MIN_CROP, natH - d.rect.y)
    }
    onChange({ x, y, w, h })
  }

  function endDrag() {
    drag.current = null
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label={moveLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="absolute cursor-move touch-none border border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] outline outline-1 -outline-offset-1 outline-black/40"
      style={{
        left: rect.x * zoom,
        top: rect.y * zoom,
        width: rect.w * zoom,
        height: rect.h * zoom,
      }}
    >
      {CORNERS.map((c) => (
        <span
          key={c.key}
          data-handle={c.key}
          aria-label={cornerLabel}
          className={cn(
            'absolute size-3 touch-none rounded-sm border-2 border-background bg-brand',
            c.pos,
            c.cursor,
          )}
        />
      ))}
    </div>
  )
}
