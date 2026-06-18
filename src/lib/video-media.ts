import { useEffect, useState } from 'react'

// Client-side media extraction helpers for the video editor: a thumbnail
// filmstrip (seek a detached <video> and grab frames off a canvas) and an audio
// waveform (decode the file's audio with WebAudio and reduce to peaks). Both run
// entirely in the browser — nothing is uploaded — and are best-effort: codecs the
// browser can't decode just yield an empty result rather than throwing.

export interface Thumb {
  time: number
  url: string
}

const THUMB_HEIGHT = 64

function once(el: HTMLMediaElement, event: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error('aborted'))
    const ok = () => {
      cleanup()
      resolve()
    }
    const fail = () => {
      cleanup()
      reject(new Error(`media ${event} failed`))
    }
    const abort = () => {
      cleanup()
      reject(new Error('aborted'))
    }
    function cleanup() {
      el.removeEventListener(event, ok)
      el.removeEventListener('error', fail)
      signal.removeEventListener('abort', abort)
    }
    el.addEventListener(event, ok, { once: true })
    el.addEventListener('error', fail, { once: true })
    signal.addEventListener('abort', abort, { once: true })
  })
}

// Walk a detached video through `count` evenly-spaced positions, emitting a JPEG
// thumbnail for each via `onThumb` so the strip can fill in progressively.
async function buildFilmstrip(
  file: File,
  count: number,
  onThumb: (t: Thumb) => void,
  signal: AbortSignal,
): Promise<void> {
  const src = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.preload = 'auto'
  video.src = src
  try {
    await once(video, 'loadedmetadata', signal)
    const duration = video.duration
    if (!Number.isFinite(duration) || duration <= 0 || !video.videoWidth) return
    const ratio = video.videoWidth / video.videoHeight
    const w = Math.max(1, Math.round(THUMB_HEIGHT * ratio))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = THUMB_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    for (let i = 0; i < count; i++) {
      if (signal.aborted) return
      const time = Math.min(duration - 0.05, ((i + 0.5) / count) * duration)
      video.currentTime = Math.max(0, time)
      await once(video, 'seeked', signal)
      ctx.drawImage(video, 0, 0, w, THUMB_HEIGHT)
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.72))
      if (blob && !signal.aborted) onThumb({ time, url: URL.createObjectURL(blob) })
    }
  } finally {
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(src)
  }
}

interface StripState {
  file: File | null
  thumbs: Thumb[]
  done: boolean
}

// Progressive thumbnail filmstrip for a video file. Thumbnails stream in as they
// are decoded; object URLs are revoked on unmount or when the file changes. State
// is keyed by file so a file change resets the strip without a synchronous
// setState in the effect body.
export function useFilmstrip(file: File | null, count: number) {
  const [state, setState] = useState<StripState>({ file: null, thumbs: [], done: true })

  useEffect(() => {
    if (!file || count <= 0) return
    const controller = new AbortController()
    const created: string[] = []
    const collected: Thumb[] = []
    buildFilmstrip(
      file,
      count,
      (t) => {
        created.push(t.url)
        collected.push(t)
        setState({ file, thumbs: [...collected], done: false })
      },
      controller.signal,
    )
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setState({ file, thumbs: [...collected], done: true })
      })
    return () => {
      controller.abort()
      created.forEach(URL.revokeObjectURL)
    }
  }, [file, count])

  const current = state.file === file
  return { thumbs: current ? state.thumbs : [], loading: current ? !state.done : !!file }
}

// Decode the file's audio track and reduce it to `buckets` normalized peaks
// (0..1). Returns an empty array if the browser can't decode the audio.
async function buildWaveform(file: File, buckets: number, signal: AbortSignal): Promise<number[]> {
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return []
  const ctx = new Ctor()
  try {
    const buffer = await file.arrayBuffer()
    if (signal.aborted) return []
    const audio = await ctx.decodeAudioData(buffer)
    const data = audio.getChannelData(0)
    const block = Math.max(1, Math.floor(data.length / buckets))
    const peaks: number[] = []
    let peak = 0
    for (let i = 0; i < buckets; i++) {
      let max = 0
      const base = i * block
      for (let j = 0; j < block; j++) {
        const v = Math.abs(data[base + j] || 0)
        if (v > max) max = v
      }
      peaks.push(max)
      if (max > peak) peak = max
    }
    // Normalize so the loudest moment fills the track.
    return peak > 0 ? peaks.map((p) => p / peak) : peaks
  } finally {
    ctx.close().catch(() => {})
  }
}

// Audio waveform peaks for a video/audio file, or null while loading / when the
// audio can't be decoded. Keyed by file so a file change resets without a
// synchronous setState in the effect body.
export function useWaveform(file: File | null, buckets = 1400) {
  const [state, setState] = useState<{ file: File | null; peaks: number[] | null }>({
    file: null,
    peaks: null,
  })

  useEffect(() => {
    if (!file) return
    const controller = new AbortController()
    buildWaveform(file, buckets, controller.signal)
      .then((p) => {
        if (!controller.signal.aborted) setState({ file, peaks: p.length ? p : null })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ file, peaks: null })
      })
    return () => controller.abort()
  }, [file, buckets])

  return state.file === file ? state.peaks : null
}

const NICE_STEPS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]

// Smallest "nice" tick interval (seconds) that is at least `minSeconds`, so
// ruler labels stay legible at any zoom.
export function niceTickInterval(minSeconds: number): number {
  return NICE_STEPS.find((s) => s >= minSeconds) ?? 3600
}

// Compact timecode for ruler/readouts: "m:ss" (or "h:mm:ss"), no fractional part.
export function clockTimecode(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}
