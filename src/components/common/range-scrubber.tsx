import { useCallback, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

interface RangeScrubberProps {
  duration: number
  start: number
  end: number
  current: number
  onChangeStart: (t: number) => void
  onChangeEnd: (t: number) => void
  onSeek: (t: number) => void
  ariaLabel?: string
}

const MIN_GAP = 0.1

// A timeline with two draggable handles (start/end) over a video's duration, a
// highlighted selection, and a live playhead. Clicking the track seeks. Handles
// are keyboard-operable (arrow keys nudge by 1s, ⇧ by 5s).
export function RangeScrubber({
  duration,
  start,
  end,
  current,
  onChangeStart,
  onChangeEnd,
  onSeek,
  ariaLabel,
}: RangeScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'start' | 'end' | null>(null)

  const timeAt = useCallback(
    (clientX: number) => {
      const r = trackRef.current?.getBoundingClientRect()
      if (!r || r.width === 0) return 0
      const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
      return pct * duration
    },
    [duration],
  )

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging.current) return
      const t = timeAt(e.clientX)
      if (dragging.current === 'start') onChangeStart(Math.min(t, end - MIN_GAP))
      else onChangeEnd(Math.max(t, start + MIN_GAP))
    }
    function onUp() {
      dragging.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [timeAt, start, end, onChangeStart, onChangeEnd])

  const pct = (t: number) => (duration > 0 ? (t / duration) * 100 : 0)
  const disabled = duration <= 0

  function nudge(which: 'start' | 'end', delta: number) {
    if (which === 'start') onChangeStart(Math.max(0, Math.min(start + delta, end - MIN_GAP)))
    else onChangeEnd(Math.min(duration, Math.max(end + delta, start + MIN_GAP)))
  }

  function handleKey(which: 'start' | 'end') {
    return (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 5 : 1
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nudge(which, -step)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nudge(which, step)
      }
    }
  }

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative h-12 w-full rounded-lg border bg-surface-2 select-none',
        disabled && 'pointer-events-none opacity-50',
      )}
      onPointerDown={(e) => {
        // Click on the track body (not a handle) seeks.
        if (e.target === trackRef.current) onSeek(timeAt(e.clientX))
      }}
    >
      {/* selection */}
      <div
        className="pointer-events-none absolute inset-y-0 bg-brand/15"
        style={{ left: `${pct(start)}%`, width: `${pct(end) - pct(start)}%` }}
      />
      {/* playhead */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-foreground/70"
        style={{ left: `${pct(current)}%` }}
      />
      {/* handles */}
      {(['start', 'end'] as const).map((which) => {
        const value = which === 'start' ? start : end
        return (
          <button
            key={which}
            type="button"
            role="slider"
            aria-label={`${ariaLabel ?? 'Selection'} ${which}`}
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={value}
            onPointerDown={(e) => {
              e.preventDefault()
              ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
              dragging.current = which
            }}
            onKeyDown={handleKey(which)}
            style={{ left: `${pct(value)}%` }}
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-brand bg-background shadow-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        )
      })}
    </div>
  )
}
