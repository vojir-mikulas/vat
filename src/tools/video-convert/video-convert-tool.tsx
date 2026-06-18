import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { VIDEO_TARGETS, videoConvertArgs, type VideoTarget } from '@/lib/ffmpeg-args'
import { replaceExtension } from '@/lib/image'
import { useFfmpegJob } from '@/lib/use-ffmpeg'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dropzone } from '@/components/common/dropzone'
import { FfmpegStatus, MediaResult } from '@/components/common/media-result'

const inputNameFor = (file: File) => `input.${file.name.split('.').pop() || 'mp4'}`

export default function VideoConvertTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState<VideoTarget>('mp4')
  const [fps, setFps] = useState(12)
  const [width, setWidth] = useState(480)
  const { phase, progress, error, output, run } = useFfmpegJob()
  const busy = phase === 'loading' || phase === 'running'

  const spec = useMemo(() => VIDEO_TARGETS.find((s) => s.id === target)!, [target])

  function convert() {
    if (!file) return
    const inputName = inputNameFor(file)
    const outputName = `output.${spec.ext}`
    run({
      input: file,
      inputName,
      outputName,
      outputMime: spec.mime,
      args: videoConvertArgs(inputName, outputName, target, { fps, width }),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone accept="video/*,image/gif" prompt={t('video-convert.prompt')} file={file} onFile={setFile} />

      {file ? (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-2xs uppercase tracking-wide text-muted-foreground">
                {t('video-convert.format')}
              </span>
              <Select value={target} onValueChange={(v) => setTarget(v as VideoTarget)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_TARGETS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {target === 'gif' ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="vc-fps" className="text-2xs uppercase tracking-wide text-muted-foreground">
                    {t('video-convert.fps')}
                  </Label>
                  <Input
                    id="vc-fps"
                    type="number"
                    min={1}
                    max={50}
                    value={fps}
                    onChange={(e) => setFps(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                    className="w-24"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="vc-width" className="text-2xs uppercase tracking-wide text-muted-foreground">
                    {t('video-convert.width')}
                  </Label>
                  <Input
                    id="vc-width"
                    type="number"
                    min={16}
                    max={2000}
                    value={width}
                    onChange={(e) =>
                      setWidth(Math.max(16, Math.min(2000, Number(e.target.value) || 16)))
                    }
                    className="w-28"
                  />
                </div>
              </>
            ) : null}

            <Button disabled={busy} onClick={convert}>
              {t('video-convert.convert')}
            </Button>
          </div>
          <span className="text-2xs text-muted-foreground">{t('video-convert.note')}</span>
        </>
      ) : null}

      <FfmpegStatus phase={phase} progress={progress} error={error} />
      {output && file ? (
        <MediaResult output={output} kind={spec.kind} filename={replaceExtension(file.name, spec.ext)} />
      ) : null}
    </div>
  )
}
