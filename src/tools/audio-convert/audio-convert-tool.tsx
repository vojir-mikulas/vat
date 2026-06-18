import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AUDIO_BITRATES, AUDIO_TARGETS, audioConvertArgs, type AudioTarget } from '@/lib/ffmpeg-args'
import { replaceExtension } from '@/lib/image'
import { useFfmpegJob } from '@/lib/use-ffmpeg'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dropzone } from '@/components/common/dropzone'
import { FfmpegStatus, MediaResult } from '@/components/common/media-result'

const inputNameFor = (file: File) => `input.${file.name.split('.').pop() || 'audio'}`

export default function AudioConvertTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState<AudioTarget>('mp3')
  const [bitrate, setBitrate] = useState(192)
  const { phase, progress, error, output, run } = useFfmpegJob()
  const busy = phase === 'loading' || phase === 'running'

  const spec = useMemo(() => AUDIO_TARGETS.find((s) => s.id === target)!, [target])

  function convert() {
    if (!file) return
    const inputName = inputNameFor(file)
    const outputName = `output.${spec.ext}`
    run({
      input: file,
      inputName,
      outputName,
      outputMime: spec.mime,
      args: audioConvertArgs(inputName, outputName, target, bitrate),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone accept="audio/*" prompt={t('audio-convert.prompt')} file={file} onFile={setFile} />

      {file ? (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-2xs uppercase tracking-wide text-muted-foreground">
                {t('audio-convert.format')}
              </span>
              <Select value={target} onValueChange={(v) => setTarget(v as AudioTarget)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIO_TARGETS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {spec.lossy ? (
              <div className="flex flex-col gap-2">
                <span className="text-2xs uppercase tracking-wide text-muted-foreground">
                  {t('audio-convert.bitrate')}
                </span>
                <Select value={String(bitrate)} onValueChange={(v) => setBitrate(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIO_BITRATES.map((b) => (
                      <SelectItem key={b} value={String(b)}>
                        {t('audio-convert.kbps', { rate: b })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <Button disabled={busy} onClick={convert}>
              {t('audio-convert.convert')}
            </Button>
          </div>
          <span className="text-2xs text-muted-foreground">{t('audio-convert.note')}</span>
        </>
      ) : null}

      <FfmpegStatus phase={phase} progress={progress} error={error} />
      {output && file ? (
        <MediaResult output={output} kind="audio" filename={replaceExtension(file.name, spec.ext)} />
      ) : null}
    </div>
  )
}
