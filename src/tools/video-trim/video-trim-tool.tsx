import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronFirst, ChevronLast } from 'lucide-react'

import { formatTimecode, trimArgs } from '@/lib/ffmpeg-args'
import { useObjectUrl } from '@/lib/use-object-url'
import { useFfmpegJob } from '@/lib/use-ffmpeg'
import { Button } from '@/components/ui/button'
import { Dropzone } from '@/components/common/dropzone'
import { RangeScrubber } from '@/components/common/range-scrubber'
import { FfmpegStatus, MediaResult } from '@/components/common/media-result'

const extOf = (file: File) => file.name.split('.').pop() || 'mp4'

export default function VideoTrimTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const url = useObjectUrl(file)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const { phase, progress, error, output, run } = useFfmpegJob()
  const busy = phase === 'loading' || phase === 'running'

  function seek(t: number) {
    if (videoRef.current) videoRef.current.currentTime = t
    setCurrent(t)
  }

  function trim() {
    if (!file || end <= start) return
    const ext = extOf(file)
    const inputName = `input.${ext}`
    const outputName = `output.${ext}`
    run({
      input: file,
      inputName,
      outputName,
      outputMime: file.type || 'video/mp4',
      args: trimArgs(inputName, outputName, start, end),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        accept="video/*"
        prompt={t('video-trim.prompt')}
        file={file}
        onFile={(f) => {
          setFile(f)
          setDuration(0)
          setStart(0)
          setEnd(0)
        }}
      />

      {url ? (
        <>
          <video
            ref={videoRef}
            src={url}
            controls
            className="max-h-[24rem] w-full rounded-xl border bg-black"
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration
              setDuration(d)
              setEnd(d)
              setStart(0)
            }}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          />

          <RangeScrubber
            duration={duration}
            start={start}
            end={end}
            current={current}
            ariaLabel={t('video-trim.selection')}
            onChangeStart={(tm) => {
              setStart(tm)
              seek(tm)
            }}
            onChangeEnd={(tm) => {
              setEnd(tm)
              seek(tm)
            }}
            onSeek={seek}
          />

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Button variant="outline" size="sm" onClick={() => setStart(Math.min(current, end - 0.1))}>
              <ChevronFirst />
              {t('video-trim.setStart')}
            </Button>
            <span className="font-mono tabular-nums text-muted-foreground">
              {formatTimecode(start)} → {formatTimecode(end)} ({formatTimecode(Math.max(0, end - start))})
            </span>
            <Button variant="outline" size="sm" onClick={() => setEnd(Math.max(current, start + 0.1))}>
              {t('video-trim.setEnd')}
              <ChevronLast />
            </Button>
            <Button className="ml-auto" disabled={busy || end <= start} onClick={trim}>
              {t('video-trim.trim')}
            </Button>
          </div>
          <span className="text-2xs text-muted-foreground">{t('video-trim.note')}</span>
        </>
      ) : null}

      <FfmpegStatus phase={phase} progress={progress} error={error} />
      {output && file ? (
        <MediaResult output={output} kind="video" filename={`trimmed.${extOf(file)}`} />
      ) : null}
    </div>
  )
}
