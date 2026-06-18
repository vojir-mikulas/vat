import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Camera,
  ChevronFirst,
  ChevronLast,
  Download,
  Maximize,
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import { formatTimecode, trimArgs } from '@/lib/ffmpeg-args'
import { replaceExtension } from '@/lib/image'
import { downloadBlob } from '@/lib/download'
import { useObjectUrl } from '@/lib/use-object-url'
import { useFfmpegJob } from '@/lib/use-ffmpeg'
import { useFilmstrip, useWaveform } from '@/lib/video-media'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dropzone } from '@/components/common/dropzone'
import { VideoPlayer, type VideoPlayerHandle } from '@/components/common/video-player'
import { VideoTimeline } from '@/components/common/video-timeline'
import { FfmpegStatus, MediaResult } from '@/components/common/media-result'

const extOf = (file: File) => file.name.split('.').pop() || 'mp4'
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const MIN_PPS = 1
const MAX_PPS = 800
const ZOOM_FACTOR = 1.6

interface Capture {
  url: string
  blob: Blob
  time: number
}

// A non-linear-editor for video: a program monitor on top, then a zoomable
// timeline with a thumbnail filmstrip, an audio waveform, a draggable playhead
// and in/out trim handles. Export the selection (fast stream-copy trim) or grab
// the current frame as a PNG — everything runs in the browser via ffmpeg.wasm
// and canvas, nothing is uploaded.
export default function VideoEditorTool() {
  const { t } = useTranslation('tools')
  const { t: tc } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const url = useObjectUrl(file)
  const playerRef = useRef<VideoPlayerHandle>(null)
  const timelineWrapRef = useRef<HTMLDivElement>(null)

  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [inPoint, setInPoint] = useState(0)
  const [outPoint, setOutPoint] = useState(0)
  const [pxPerSec, setPxPerSec] = useState(20)
  const [captures, setCaptures] = useState<Capture[]>([])

  const thumbCount = duration > 0 ? clamp(Math.round(duration / 2), 12, 60) : 0
  const { thumbs, loading: stripLoading } = useFilmstrip(file, thumbCount)
  const waveform = useWaveform(file)
  const { phase, progress, error, output, run } = useFfmpegJob()
  const busy = phase === 'loading' || phase === 'running'

  // Fit the timeline width to the available space.
  const fit = useCallback(() => {
    const w = timelineWrapRef.current?.clientWidth ?? 0
    if (w > 0 && duration > 0) setPxPerSec(clamp((w - 4) / duration, MIN_PPS, MAX_PPS))
  }, [duration])

  useLayoutEffect(() => {
    fit()
  }, [fit])

  // Revoke capture object URLs on unmount. The ref tracks the latest list
  // (updated in an effect, never during render).
  const capturesRef = useRef(captures)
  useEffect(() => {
    capturesRef.current = captures
  })
  useEffect(
    () => () => {
      capturesRef.current.forEach((c) => URL.revokeObjectURL(c.url))
    },
    [],
  )

  function loadFile(f: File | null) {
    captures.forEach((c) => URL.revokeObjectURL(c.url))
    setCaptures([])
    setFile(f)
    setDuration(0)
    setCurrent(0)
    setInPoint(0)
    setOutPoint(0)
  }

  function seek(time: number) {
    playerRef.current?.seek(time)
    setCurrent(time)
  }

  function zoom(dir: 1 | -1) {
    setPxPerSec((p) => clamp(p * (dir === 1 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR), MIN_PPS, MAX_PPS))
  }

  function captureFrame() {
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
      setCaptures((prev) =>
        [...prev, { url: URL.createObjectURL(blob), blob, time }].sort((a, b) => a.time - b.time),
      )
    }, 'image/png')
  }

  function removeCapture(cap: Capture) {
    URL.revokeObjectURL(cap.url)
    setCaptures((prev) => prev.filter((c) => c !== cap))
  }

  function exportClip() {
    if (!file || outPoint <= inPoint) return
    const ext = extOf(file)
    run({
      input: file,
      inputName: `input.${ext}`,
      outputName: `output.${ext}`,
      outputMime: file.type || 'video/mp4',
      args: trimArgs(`input.${ext}`, `output.${ext}`, inPoint, outPoint),
    })
  }

  const selection = Math.max(0, outPoint - inPoint)

  return (
    <div className="flex flex-col gap-4">
      <Dropzone accept="video/*" prompt={t('video-editor.prompt')} file={file} onFile={loadFile} />

      {url ? (
        <>
          {/* Program monitor */}
          <VideoPlayer
            key={url}
            ref={playerRef}
            src={url}
            onReady={(v) => {
              setDuration(v.duration)
              setInPoint(0)
              setOutPoint(v.duration)
            }}
            onTime={(c, d) => {
              setCurrent(c)
              if (d && d !== duration) setDuration(d)
            }}
          />

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-surface-1 px-3 py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInPoint(Math.min(current, outPoint - 0.05))}
            >
              <ChevronFirst />
              {t('video-editor.setIn')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOutPoint(Math.max(current, inPoint + 0.05))}
            >
              {t('video-editor.setOut')}
              <ChevronLast />
            </Button>

            <span className="px-1 font-mono text-xs tabular-nums text-muted-foreground">
              {formatTimecode(inPoint)} → {formatTimecode(outPoint)}
              <span className="ml-1 text-brand">({formatTimecode(selection)})</span>
            </span>

            <Separator orientation="vertical" className="mx-1 !h-6" />

            <Button variant="outline" size="sm" onClick={captureFrame}>
              <Camera />
              {t('video-editor.capture')}
            </Button>

            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('video-editor.zoomOut')}
                onClick={() => zoom(-1)}
              >
                <ZoomOut />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('video-editor.zoomIn')}
                onClick={() => zoom(1)}
              >
                <ZoomIn />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('video-editor.fit')}
                onClick={fit}
              >
                <Maximize />
              </Button>
              <Separator orientation="vertical" className="mx-1 !h-6" />
              <Button
                variant="brand"
                size="sm"
                disabled={busy || selection <= 0}
                onClick={exportClip}
              >
                <Scissors />
                {t('video-editor.export')}
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div ref={timelineWrapRef}>
            <VideoTimeline
              duration={duration}
              current={current}
              inPoint={inPoint}
              outPoint={outPoint}
              pxPerSec={pxPerSec}
              thumbs={thumbs}
              thumbCount={thumbCount}
              waveform={waveform}
              markers={captures.map((c) => c.time)}
              onSeek={seek}
              onChangeIn={setInPoint}
              onChangeOut={setOutPoint}
            />
          </div>
          <span className="text-2xs text-muted-foreground">
            {stripLoading ? `${t('video-editor.building')} ` : ''}
            {t('video-editor.note')}
          </span>

          {/* Captured frames */}
          {captures.length > 0 && file ? (
            <div className="flex flex-col gap-2">
              <span className="text-2xs uppercase tracking-wide text-muted-foreground">
                {t('video-editor.captures')} ({captures.length})
              </span>
              <div className="flex flex-wrap gap-3">
                {captures.map((cap) => (
                  <div
                    key={cap.url}
                    className="group relative overflow-hidden rounded-lg border bg-surface-1"
                  >
                    <button
                      type="button"
                      onClick={() => seek(cap.time)}
                      aria-label={formatTimecode(cap.time)}
                      className="block"
                    >
                      <img src={cap.url} alt="" className="h-24 w-auto" />
                    </button>
                    <div className="flex items-center justify-between gap-2 border-t px-2 py-1">
                      <span className="font-mono text-2xs tabular-nums text-muted-foreground">
                        {formatTimecode(cap.time)}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={tc('media.download')}
                          onClick={() =>
                            downloadBlob(
                              cap.blob,
                              replaceExtension(file.name, 'png').replace(
                                /\.png$/,
                                `-${Math.round(cap.time)}s.png`,
                              ),
                            )
                          }
                        >
                          <Download />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={t('video-editor.removeCapture')}
                          onClick={() => removeCapture(cap)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <FfmpegStatus phase={phase} progress={progress} error={error} />
      {output && file ? (
        <MediaResult output={output} kind="video" filename={`clip.${extOf(file)}`} />
      ) : null}
    </div>
  )
}
