import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronFirst,
  ChevronLast,
  Maximize,
  Pause,
  Play,
  Wand2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import { audioEditArgs, formatTimecode, type AudioEditOptions } from '@/lib/ffmpeg-args'
import { replaceExtension } from '@/lib/image'
import { useObjectUrl } from '@/lib/use-object-url'
import { useFfmpegJob } from '@/lib/use-ffmpeg'
import { useWaveform } from '@/lib/video-media'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Dropzone } from '@/components/common/dropzone'
import { AudioTimeline } from '@/components/common/audio-timeline'
import { FfmpegStatus, MediaResult } from '@/components/common/media-result'

const extOf = (file: File) => file.name.split('.').pop() || 'mp3'
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const MIN_PPS = 1
const MAX_PPS = 800
const ZOOM_FACTOR = 1.6

const GAINS = [-12, -9, -6, -3, 0, 3, 6, 9, 12]
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

// A waveform editor for audio, mirroring the video editor: a transport + a
// zoomable waveform timeline with draggable in/out trim handles, plus an effects
// rack (normalize, gain, fade, speed, reverse, silence-trim). Export applies the
// trim and the whole effect chain in one ffmpeg.wasm pass — nothing is uploaded.
export default function AudioEditorTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const url = useObjectUrl(file)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timelineWrapRef = useRef<HTMLDivElement>(null)

  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [inPoint, setInPoint] = useState(0)
  const [outPoint, setOutPoint] = useState(0)
  const [pxPerSec, setPxPerSec] = useState(20)
  const [playing, setPlaying] = useState(false)

  // Effects.
  const [normalize, setNormalize] = useState(false)
  const [reverse, setReverse] = useState(false)
  const [trimSilence, setTrimSilence] = useState(false)
  const [gainDb, setGainDb] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [fadeIn, setFadeIn] = useState(0)
  const [fadeOut, setFadeOut] = useState(0)

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

  function loadFile(f: File | null) {
    setFile(f)
    setDuration(0)
    setCurrent(0)
    setInPoint(0)
    setOutPoint(0)
    setPlaying(false)
    setNormalize(false)
    setReverse(false)
    setTrimSilence(false)
    setGainDb(0)
    setSpeed(1)
    setFadeIn(0)
    setFadeOut(0)
  }

  function seek(time: number) {
    const a = audioRef.current
    if (a) a.currentTime = clamp(time, 0, duration || 0)
    setCurrent(time)
  }

  function togglePlay() {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      // Start from the selection's in-point if the playhead is outside it.
      if (current < inPoint || current >= outPoint) a.currentTime = inPoint
      a.play()
    } else {
      a.pause()
    }
  }

  function zoom(dir: 1 | -1) {
    setPxPerSec((p) => clamp(p * (dir === 1 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR), MIN_PPS, MAX_PPS))
  }

  function exportAudio() {
    if (!file || outPoint <= inPoint) return
    const ext = extOf(file)
    const opts: AudioEditOptions = {
      start: inPoint,
      end: outPoint,
      normalize,
      gainDb,
      fadeIn,
      fadeOut,
      speed,
      reverse,
      trimSilence,
    }
    run({
      input: file,
      inputName: `input.${ext}`,
      outputName: `output.${ext}`,
      outputMime: file.type || 'audio/mpeg',
      args: audioEditArgs(`input.${ext}`, `output.${ext}`, opts),
    })
  }

  const selection = Math.max(0, outPoint - inPoint)
  const hasEdits =
    inPoint > 0 ||
    outPoint < duration ||
    normalize ||
    reverse ||
    trimSilence ||
    gainDb !== 0 ||
    speed !== 1 ||
    fadeIn > 0 ||
    fadeOut > 0

  return (
    <div className="flex flex-col gap-4">
      <Dropzone accept="audio/*" prompt={t('audio-editor.prompt')} file={file} onFile={loadFile} />

      {url ? (
        <>
          <audio
            key={url}
            ref={audioRef}
            src={url}
            onLoadedMetadata={(e) => {
              const a = e.currentTarget
              setDuration(a.duration)
              setInPoint(0)
              setOutPoint(a.duration)
            }}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="hidden"
          />

          {/* Transport / trim toolbar */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-surface-1 px-3 py-2">
            <Button variant="outline" size="sm" onClick={togglePlay}>
              {playing ? <Pause /> : <Play />}
              {playing ? t('audio-editor.pause') : t('audio-editor.play')}
            </Button>

            <Separator orientation="vertical" className="mx-1 !h-6" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setInPoint(Math.min(current, outPoint - 0.05))}
            >
              <ChevronFirst />
              {t('audio-editor.setIn')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOutPoint(Math.max(current, inPoint + 0.05))}
            >
              {t('audio-editor.setOut')}
              <ChevronLast />
            </Button>

            <span className="px-1 font-mono text-xs tabular-nums text-muted-foreground">
              {formatTimecode(inPoint)} → {formatTimecode(outPoint)}
              <span className="ml-1 text-brand">({formatTimecode(selection)})</span>
            </span>

            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('audio-editor.zoomOut')}
                onClick={() => zoom(-1)}
              >
                <ZoomOut />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('audio-editor.zoomIn')}
                onClick={() => zoom(1)}
              >
                <ZoomIn />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('audio-editor.fit')}
                onClick={fit}
              >
                <Maximize />
              </Button>
              <Separator orientation="vertical" className="mx-1 !h-6" />
              <Button
                variant="brand"
                size="sm"
                disabled={busy || selection <= 0 || !hasEdits}
                onClick={exportAudio}
              >
                <Wand2 />
                {t('audio-editor.export')}
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div ref={timelineWrapRef}>
            <AudioTimeline
              duration={duration}
              current={current}
              inPoint={inPoint}
              outPoint={outPoint}
              pxPerSec={pxPerSec}
              waveform={waveform}
              onSeek={seek}
              onChangeIn={setInPoint}
              onChangeOut={setOutPoint}
            />
          </div>

          {/* Effects rack */}
          <div className="grid gap-4 rounded-xl border bg-surface-1 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToggleRow
              label={t('audio-editor.normalize')}
              hint={t('audio-editor.normalizeHint')}
              checked={normalize}
              onChange={setNormalize}
            />
            <ToggleRow
              label={t('audio-editor.reverse')}
              checked={reverse}
              onChange={setReverse}
            />
            <ToggleRow
              label={t('audio-editor.trimSilence')}
              hint={t('audio-editor.trimSilenceHint')}
              checked={trimSilence}
              onChange={setTrimSilence}
            />

            <Field label={t('audio-editor.gain')}>
              <Select value={String(gainDb)} onValueChange={(v) => setGainDb(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAINS.map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      {t('audio-editor.db', { value: g > 0 ? `+${g}` : g })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t('audio-editor.speed')}>
              <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEEDS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}×
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('audio-editor.fadeIn')}>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={fadeIn}
                  onChange={(e) => setFadeIn(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
              <Field label={t('audio-editor.fadeOut')}>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={fadeOut}
                  onChange={(e) => setFadeOut(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
            </div>
          </div>

          <span className="text-2xs text-muted-foreground">{t('audio-editor.note')}</span>
        </>
      ) : null}

      <FfmpegStatus phase={phase} progress={progress} error={error} />
      {output && file ? (
        <MediaResult
          output={output}
          kind="audio"
          filename={replaceExtension(file.name, extOf(file)).replace(
            new RegExp(`\\.${extOf(file)}$`),
            `-edited.${extOf(file)}`,
          )}
        />
      ) : null}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="flex flex-col">
        <span className="text-sm">{label}</span>
        {hint ? <span className="text-2xs text-muted-foreground">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
