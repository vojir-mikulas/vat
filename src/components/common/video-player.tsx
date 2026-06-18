import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  Gauge,
  Maximize,
  Minimize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const FRAME_STEP = 1 / 30 // ~one frame at 30fps
const SEEK_STEP = 5 // arrow-key seek, seconds
const SPEEDS = [0.25, 0.5, 1, 1.5, 2] as const

// Compact wall-clock timecode for the control bar: "m:ss" (or "h:mm:ss").
function clock(s: number): string {
  const total = Number.isFinite(s) && s > 0 ? s : 0
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = Math.floor(total % 60)
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export interface VideoPlayerHandle {
  readonly video: HTMLVideoElement | null
  seek: (t: number) => void
  play: () => void
  pause: () => void
}

interface VideoPlayerProps {
  src: string
  className?: string
  /** Replaces the default seek bar (e.g. a trim range selector). */
  timeline?: ReactNode
  /** Extra controls rendered at the right of the button row. */
  actions?: ReactNode
  /** Show the per-frame step buttons (default true). */
  frameStep?: boolean
  onReady?: (video: HTMLVideoElement) => void
  onTime?: (current: number, duration: number) => void
}

// A draggable progress/seek bar with a buffered indicator. Pointer + keyboard
// operable; reports the scrubbed time live so the <video> can seek as you drag.
function SeekBar({
  current,
  duration,
  buffered,
  onSeek,
  ariaLabel,
}: {
  current: number
  duration: number
  buffered: number
  onSeek: (t: number) => void
  ariaLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const timeAt = useCallback(
    (clientX: number) => {
      const r = ref.current?.getBoundingClientRect()
      if (!r || r.width === 0) return 0
      return clamp((clientX - r.left) / r.width, 0, 1) * duration
    },
    [duration],
  )

  useEffect(() => {
    function move(e: PointerEvent) {
      if (dragging.current) onSeek(timeAt(e.clientX))
    }
    function up() {
      dragging.current = false
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [timeAt, onSeek])

  const pct = (t: number) => (duration > 0 ? clamp((t / duration) * 100, 0, 100) : 0)

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(current)}
      onPointerDown={(e) => {
        e.preventDefault()
        dragging.current = true
        onSeek(timeAt(e.clientX))
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          onSeek(clamp(current - SEEK_STEP, 0, duration))
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          onSeek(clamp(current + SEEK_STEP, 0, duration))
        }
      }}
      className="group/seek relative flex h-4 w-full cursor-pointer touch-none items-center select-none"
    >
      <div className="relative h-1 w-full rounded-full bg-white/25 transition-[height] group-hover/seek:h-1.5">
        {/* buffered */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/30"
          style={{ width: `${pct(buffered)}%` }}
        />
        {/* played */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          style={{ width: `${pct(current)}%` }}
        />
        {/* handle */}
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white shadow transition-transform group-hover/seek:scale-100"
          style={{ left: `${pct(current)}%` }}
        />
      </div>
    </div>
  )
}

// A custom video player: correct aspect ratio (letterboxed, never stretched),
// auto-hiding controls, keyboard shortcuts, volume, speed, frame-step and
// fullscreen. The seek bar can be swapped for a custom `timeline`.
export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  { src, className, timeline, actions, frameStep = true, onReady, onTime },
  ref,
) {
  const { t } = useTranslation()
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [ratio, setRatio] = useState(16 / 9)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [idle, setIdle] = useState(false)

  const seek = useCallback((time: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = clamp(time, 0, v.duration || 0)
    setCurrent(v.currentTime)
  }, [])

  const play = useCallback(() => videoRef.current?.play(), [])
  const pause = useCallback(() => videoRef.current?.pause(), [])

  useImperativeHandle(
    ref,
    () => ({
      get video() {
        return videoRef.current
      },
      seek,
      play,
      pause,
    }),
    [seek, play, pause],
  )

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }, [])

  const step = useCallback((delta: number) => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = clamp(v.currentTime + delta, 0, v.duration || 0)
  }, [])

  function setVol(next: number) {
    const v = videoRef.current
    const value = clamp(next, 0, 1)
    setVolume(value)
    setMuted(value === 0)
    if (v) {
      v.volume = value
      v.muted = value === 0
    }
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    const next = !muted
    v.muted = next
    setMuted(next)
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen()
    else stageRef.current?.requestFullscreen?.()
  }

  useEffect(() => {
    function onChange() {
      setFullscreen(document.fullscreenElement === stageRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Auto-hide the controls after the pointer goes idle while playing.
  const wake = useCallback(() => {
    setIdle(false)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setIdle(true), 2200)
  }, [])

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
    },
    [],
  )

  const controlsHidden = playing && idle
  const aspect = Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault()
        togglePlay()
        break
      case 'ArrowLeft':
        e.preventDefault()
        seek(current - SEEK_STEP)
        break
      case 'ArrowRight':
        e.preventDefault()
        seek(current + SEEK_STEP)
        break
      case ',':
        e.preventDefault()
        step(-FRAME_STEP)
        break
      case '.':
        e.preventDefault()
        step(FRAME_STEP)
        break
      case 'm':
        e.preventDefault()
        toggleMute()
        break
      case 'f':
        e.preventDefault()
        toggleFullscreen()
        break
    }
  }

  return (
    <TooltipProvider delayDuration={400}>
      {/* The player surface is focusable so it can own keyboard shortcuts
          (space, arrows, frame-step). Its individual controls are natively
          accessible; the container is a labelled region. */}
      {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div
        ref={stageRef}
        role="region"
        aria-label={t('player.label')}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerMove={wake}
        onPointerLeave={() => playing && setIdle(true)}
        className={cn(
          'group/player relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-xl border bg-black outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          fullscreen && 'h-full rounded-none border-0',
          className,
        )}
        style={fullscreen ? undefined : { aspectRatio: aspect, maxHeight: '70vh' }}
      >
        <video
          ref={videoRef}
          src={src}
          playsInline
          onClick={togglePlay}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget
            setDuration(v.duration)
            if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight)
            onReady?.(v)
          }}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget
            setCurrent(v.currentTime)
            onTime?.(v.currentTime, v.duration)
          }}
          onProgress={(e) => {
            const v = e.currentTarget
            if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1))
          }}
          onPlay={() => {
            setPlaying(true)
            wake()
          }}
          onPause={() => {
            setPlaying(false)
            setIdle(false)
          }}
          onVolumeChange={(e) => {
            setVolume(e.currentTarget.volume)
            setMuted(e.currentTarget.muted)
          }}
          className="h-full max-h-[70vh] w-full object-contain"
        />

        {/* Center play affordance when paused */}
        {!playing ? (
          <button
            type="button"
            aria-label={t('player.play')}
            onClick={togglePlay}
            className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:scale-105 hover:bg-black/60"
          >
            <Play className="size-7 translate-x-0.5 fill-current" />
          </button>
        ) : null}

        {/* Control bar */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2.5 pt-8 text-white transition-opacity duration-300',
            controlsHidden ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
        >
          {/* timeline row */}
          <div className="px-0.5">
            {timeline ?? (
              <SeekBar
                current={current}
                duration={duration}
                buffered={buffered}
                onSeek={seek}
                ariaLabel={t('player.seek')}
              />
            )}
          </div>

          {/* button row */}
          <div className="flex items-center gap-1">
            <PlayerButton
              label={playing ? t('player.pause') : t('player.play')}
              onClick={togglePlay}
            >
              {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
            </PlayerButton>

            {frameStep ? (
              <>
                <PlayerButton label={t('player.prevFrame')} onClick={() => step(-FRAME_STEP)}>
                  <SkipBack />
                </PlayerButton>
                <PlayerButton label={t('player.nextFrame')} onClick={() => step(FRAME_STEP)}>
                  <SkipForward />
                </PlayerButton>
              </>
            ) : null}

            <span className="ml-1 font-mono text-xs tabular-nums text-white/90">
              {clock(current)} <span className="text-white/50">/ {clock(duration)}</span>
            </span>

            <div className="ml-auto flex items-center gap-1">
              {/* volume */}
              <div className="group/vol flex items-center">
                <PlayerButton
                  label={muted ? t('player.unmute') : t('player.mute')}
                  onClick={toggleMute}
                >
                  <VolumeIcon />
                </PlayerButton>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  aria-label={t('player.volume')}
                  onChange={(e) => setVol(Number(e.target.value))}
                  className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 opacity-0 transition-all duration-200 outline-none group-hover/vol:w-16 group-hover/vol:opacity-100 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              {/* speed */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={t('player.speed')}
                        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-white/90 transition hover:bg-white/15"
                      >
                        <Gauge className="size-4" />
                        {rate}×
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{t('player.speed')}</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="min-w-20">
                  {SPEEDS.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onSelect={() => {
                        setRate(s)
                        if (videoRef.current) videoRef.current.playbackRate = s
                      }}
                      className={cn('justify-between', s === rate && 'font-semibold text-brand')}
                    >
                      {s}×{s === 1 ? ` ${t('player.normal')}` : ''}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {actions}

              <PlayerButton
                label={fullscreen ? t('player.exitFullscreen') : t('player.fullscreen')}
                onClick={toggleFullscreen}
              >
                {fullscreen ? <Minimize /> : <Maximize />}
              </PlayerButton>
            </div>
          </div>
        </div>
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
    </TooltipProvider>
  )
})

// Small icon button styled for the dark control bar, with a tooltip.
function PlayerButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={label}
          onClick={onClick}
          className="text-white hover:bg-white/15 hover:text-white"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
