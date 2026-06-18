import { useCallback, useEffect, useMemo, useRef } from 'react'

import { clockTimecode, niceTickInterval } from '@/lib/video-media'

const RULER_H = 26
const WAVE_H = 120
const MIN_GAP = 0.02
const TARGET_LABEL_PX = 72

interface AudioTimelineProps {
  duration: number
  current: number
  inPoint: number
  outPoint: number
  pxPerSec: number
  waveform: number[] | null
  onSeek: (t: number) => void
  onChangeIn: (t: number) => void
  onChangeOut: (t: number) => void
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// Mirrored filled-area path for the waveform in a 0..N × 0..100 viewBox.
function waveformPath(peaks: number[]): string {
  const mid = 50
  const amp = 46
  let top = `M 0 ${mid}`
  for (let i = 0; i < peaks.length; i++) {
    const p = peaks[i] ?? 0
    top += ` L ${i} ${(mid - p * amp).toFixed(2)}`
  }
  let bottom = ''
  for (let i = peaks.length - 1; i >= 0; i--) {
    const p = peaks[i] ?? 0
    bottom += ` L ${i} ${(mid + p * amp).toFixed(2)}`
  }
  return `${top}${bottom} Z`
}

// A waveform-centric editor timeline: a time ruler over a large waveform track,
// a draggable playhead (click anywhere to seek), and draggable in/out trim
// handles that dim everything outside the selection. Zoom is parent-controlled
// via `pxPerSec`. A lean sibling of VideoTimeline with no filmstrip track.
export function AudioTimeline({
  duration,
  current,
  inPoint,
  outPoint,
  pxPerSec,
  waveform,
  onSeek,
  onChangeIn,
  onChangeOut,
}: AudioTimelineProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'seek' | 'in' | 'out' | null>(null)

  const contentWidth = Math.max(0, duration * pxPerSec)
  const tracksTop = RULER_H
  const totalHeight = RULER_H + WAVE_H
  const x = (t: number) => t * pxPerSec

  const timeAt = useCallback(
    (clientX: number) => {
      const el = scrollerRef.current
      if (!el || pxPerSec <= 0) return 0
      const r = el.getBoundingClientRect()
      return clamp((clientX - r.left + el.scrollLeft) / pxPerSec, 0, duration)
    },
    [duration, pxPerSec],
  )

  // Global drag handling for the playhead and the two trim handles.
  useEffect(() => {
    function move(e: PointerEvent) {
      const mode = dragging.current
      if (!mode) return
      const t = timeAt(e.clientX)
      if (mode === 'seek') onSeek(t)
      else if (mode === 'in') onChangeIn(clamp(t, 0, outPoint - MIN_GAP))
      else onChangeOut(clamp(t, inPoint + MIN_GAP, duration))
    }
    function up() {
      dragging.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [timeAt, onSeek, onChangeIn, onChangeOut, inPoint, outPoint, duration])

  // Keep the playhead in view as it moves past the visible window.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const px = x(current)
    const margin = 48
    if (px < el.scrollLeft + margin || px > el.scrollLeft + el.clientWidth - margin) {
      el.scrollLeft = px - el.clientWidth * 0.3
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pxPerSec])

  const ticks = useMemo(() => {
    if (duration <= 0 || pxPerSec <= 0) return []
    const interval = niceTickInterval(TARGET_LABEL_PX / pxPerSec)
    const out: number[] = []
    for (let t = 0; t <= duration + 1e-6; t += interval) out.push(t)
    return out
  }, [duration, pxPerSec])

  const wavePath = useMemo(() => (waveform ? waveformPath(waveform) : ''), [waveform])

  function startSeek(e: React.PointerEvent) {
    e.preventDefault()
    dragging.current = 'seek'
    onSeek(timeAt(e.clientX))
  }

  function handleKey(which: 'in' | 'out') {
    return (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 1 : 1 / 30
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const delta = e.key === 'ArrowLeft' ? -step : step
      if (which === 'in') onChangeIn(clamp(inPoint + delta, 0, outPoint - MIN_GAP))
      else onChangeOut(clamp(outPoint + delta, inPoint + MIN_GAP, duration))
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-surface-1">
      <div ref={scrollerRef} className="overflow-x-auto overflow-y-hidden">
        <div
          className="relative select-none"
          style={{ width: contentWidth, height: totalHeight, minWidth: '100%' }}
        >
          {/* ── Ruler (click to seek) ─────────────────────────────────── */}
          <div
            onPointerDown={startSeek}
            className="absolute inset-x-0 top-0 cursor-text border-b bg-surface-2"
            style={{ height: RULER_H }}
          >
            {ticks.map((t) => (
              <div key={t} className="absolute top-0 h-full" style={{ left: x(t) }}>
                <div className="absolute bottom-0 h-2 w-px bg-border-strong" />
                <span className="absolute bottom-1.5 left-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {clockTimecode(t)}
                </span>
              </div>
            ))}
          </div>

          {/* ── Waveform track (click to seek) ────────────────────────── */}
          <div
            onPointerDown={startSeek}
            className="absolute inset-x-0 cursor-text overflow-hidden bg-surface-2"
            style={{ top: tracksTop, height: WAVE_H }}
          >
            {waveform ? (
              <svg
                className="h-full w-full text-cat-audio"
                viewBox={`0 0 ${waveform.length} 100`}
                preserveAspectRatio="none"
              >
                <path d={wavePath} fill="currentColor" fillOpacity={0.5} />
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-2xs text-muted-foreground">
                ―
              </div>
            )}
          </div>

          {/* ── Dim outside the selection ─────────────────────────────── */}
          <div
            className="pointer-events-none absolute bg-background/65"
            style={{ top: tracksTop, height: WAVE_H, left: 0, width: x(inPoint) }}
          />
          <div
            className="pointer-events-none absolute bg-background/65"
            style={{
              top: tracksTop,
              height: WAVE_H,
              left: x(outPoint),
              width: Math.max(0, contentWidth - x(outPoint)),
            }}
          />
          {/* selection outline */}
          <div
            className="pointer-events-none absolute border-x-2 border-brand"
            style={{
              top: tracksTop,
              height: WAVE_H,
              left: x(inPoint),
              width: Math.max(0, x(outPoint) - x(inPoint)),
            }}
          />

          {/* ── Trim handles ──────────────────────────────────────────── */}
          {(['in', 'out'] as const).map((which) => {
            const value = which === 'in' ? inPoint : outPoint
            return (
              <div
                key={which}
                role="slider"
                tabIndex={0}
                aria-label={which === 'in' ? 'In point' : 'Out point'}
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(value)}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dragging.current = which
                }}
                onKeyDown={handleKey(which)}
                className="group absolute z-30 flex w-3 -translate-x-1/2 cursor-ew-resize items-center justify-center outline-none"
                style={{ top: tracksTop, height: WAVE_H, left: x(value) }}
              >
                <div className="absolute inset-y-0 w-1 bg-brand group-focus-visible:w-1.5" />
                <div className="absolute top-1/2 h-7 w-1.5 -translate-y-1/2 rounded-full bg-brand shadow ring-2 ring-background" />
              </div>
            )
          })}

          {/* ── Playhead ──────────────────────────────────────────────── */}
          <div
            className="pointer-events-none absolute top-0 z-20 w-px bg-foreground"
            style={{ left: x(current), height: totalHeight }}
          >
            <div className="absolute -top-px left-1/2 size-0 -translate-x-1/2 border-x-[5px] border-t-[7px] border-x-transparent border-t-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}
