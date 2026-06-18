import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
// Self-hosted single-threaded core (ESM build). `?url` makes Vite emit these as
// same-origin assets — no CDN (privacy-first) and no SharedArrayBuffer / COOP+COEP
// requirement. The module worker (resolved by FFmpeg via import.meta.url) imports
// the ESM core dynamically; we hand it both URLs.
// Use the package's own export entry points (the deep dist/ paths aren't exported).
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'

let instance: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null

export function isFfmpegLoaded(): boolean {
  return instance !== null
}

// Load the core once and reuse it across tools/jobs (it's ~30 MB — never reload).
export function getFFmpeg(): Promise<FFmpeg> {
  if (instance) return Promise.resolve(instance)
  if (!loadPromise) {
    const ff = new FFmpeg()
    loadPromise = ff.load({ coreURL, wasmURL }).then(() => {
      instance = ff
      return ff
    })
  }
  return loadPromise
}

export interface RunOptions {
  input: File
  inputName: string
  outputName: string
  args: string[]
  /** 0..1 transcoding progress. */
  onProgress?: (ratio: number) => void
}

// Jobs share one FFmpeg instance, which can't run two execs at once — serialize.
let queue: Promise<unknown> = Promise.resolve()

export function runFFmpeg(opts: RunOptions): Promise<Uint8Array> {
  const job = queue.then(() => execOne(opts))
  // Keep the chain alive even if a job fails.
  queue = job.catch(() => undefined)
  return job
}

async function execOne(opts: RunOptions): Promise<Uint8Array> {
  const ff = await getFFmpeg()
  const onProgress = ({ progress }: { progress: number }) => opts.onProgress?.(progress)
  ff.on('progress', onProgress)
  try {
    await ff.writeFile(opts.inputName, await fetchFile(opts.input))
    await ff.exec(opts.args)
    const data = await ff.readFile(opts.outputName)
    if (typeof data === 'string') throw new Error('Unexpected text output')
    return data
  } finally {
    ff.off('progress', onProgress)
    await ff.deleteFile(opts.inputName).catch(() => undefined)
    await ff.deleteFile(opts.outputName).catch(() => undefined)
  }
}
