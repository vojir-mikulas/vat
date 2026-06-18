import { useCallback, useEffect, useRef, useState } from 'react'

import { isFfmpegLoaded, runFFmpeg } from '@/lib/ffmpeg'

export interface FfmpegJob {
  input: File
  inputName: string
  outputName: string
  args: string[]
  outputMime: string
}

export interface MediaOutput {
  url: string
  blob: Blob
  size: number
}

export type FfmpegPhase = 'idle' | 'loading' | 'running' | 'done' | 'error'

// Drives a single ffmpeg job: tracks engine-load vs transcode phases, progress,
// errors, and the output blob (managing its object-URL lifecycle).
export function useFfmpegJob() {
  const [phase, setPhase] = useState<FfmpegPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<MediaOutput | null>(null)
  const lastUrl = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current)
    },
    [],
  )

  const run = useCallback(async (job: FfmpegJob) => {
    setError(null)
    setProgress(0)
    // First use downloads the ~30 MB core; show a distinct "loading" phase.
    setPhase(isFfmpegLoaded() ? 'running' : 'loading')
    try {
      const data = await runFFmpeg({
        input: job.input,
        inputName: job.inputName,
        outputName: job.outputName,
        args: job.args,
        onProgress: (ratio) => {
          setPhase('running')
          setProgress(Math.min(100, Math.round(ratio * 100)))
        },
      })
      const blob = new Blob([data as BlobPart], { type: job.outputMime })
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current)
      const url = URL.createObjectURL(blob)
      lastUrl.current = url
      setOutput({ url, blob, size: blob.size })
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
      setPhase('error')
    }
  }, [])

  return { phase, progress, error, output, run }
}
