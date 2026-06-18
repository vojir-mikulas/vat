// Pure helpers for the video/audio tools: time parsing and ffmpeg argument
// builders. Kept separate from the engine (lib/ffmpeg.ts) so they're unit-testable
// without loading the WASM core.

// Parse "ss", "ss.ms", "mm:ss(.ms)", or "hh:mm:ss(.ms)" into seconds. Returns null
// for empty or malformed input.
export function parseTime(input: string): number | null {
  const s = input.trim()
  if (s === '') return null
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s)
  const parts = s.split(':')
  if (parts.length < 2 || parts.length > 3) return null
  let seconds = 0
  for (const part of parts) {
    if (!/^\d+(\.\d+)?$/.test(part)) return null
    seconds = seconds * 60 + Number(part)
  }
  return seconds
}

// Format seconds as a timecode: "m:ss.s" (or "h:mm:ss.s" past an hour).
export function formatTimecode(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = s.toFixed(1).padStart(4, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export const MP3_ENCODE = ['-codec:a', 'libmp3lame', '-q:a', '2']

export function mp4ToGifArgs(input: string, output: string, fps: number, width: number): string[] {
  return ['-i', input, '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`, '-loop', '0', output]
}

export function gifToMp4Args(input: string, output: string): string[] {
  // yuv420p + even dimensions for broad player compatibility.
  return [
    '-i',
    input,
    '-movflags',
    'faststart',
    '-pix_fmt',
    'yuv420p',
    '-vf',
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    output,
  ]
}

export function frameArgs(input: string, output: string, atSeconds: number): string[] {
  // Seek before input for speed; grab a single frame.
  return ['-ss', String(atSeconds), '-i', input, '-frames:v', '1', output]
}

export function trimArgs(input: string, output: string, start: number, end: number): string[] {
  // Stream copy (no re-encode) — fast, but cuts land on keyframes.
  return ['-i', input, '-ss', String(start), '-to', String(end), '-c', 'copy', output]
}

export function audioArgs(input: string, output: string, encode: string[] = []): string[] {
  return ['-i', input, ...encode, output]
}

// ── Universal audio converter ────────────────────────────────────────────────

export type AudioTarget = 'mp3' | 'wav' | 'flac' | 'ogg' | 'opus' | 'aac'

export interface AudioTargetSpec {
  id: AudioTarget
  label: string
  ext: string
  mime: string
  lossy: boolean
}

export const AUDIO_TARGETS: AudioTargetSpec[] = [
  { id: 'mp3', label: 'MP3', ext: 'mp3', mime: 'audio/mpeg', lossy: true },
  { id: 'wav', label: 'WAV (PCM)', ext: 'wav', mime: 'audio/wav', lossy: false },
  { id: 'flac', label: 'FLAC', ext: 'flac', mime: 'audio/flac', lossy: false },
  { id: 'ogg', label: 'OGG (Vorbis)', ext: 'ogg', mime: 'audio/ogg', lossy: true },
  { id: 'opus', label: 'Opus', ext: 'opus', mime: 'audio/opus', lossy: true },
  { id: 'aac', label: 'AAC (M4A)', ext: 'm4a', mime: 'audio/mp4', lossy: true },
]

export const AUDIO_BITRATES = [96, 128, 192, 256, 320]

const AUDIO_CODEC: Record<AudioTarget, string | null> = {
  wav: null, // PCM, inferred from .wav
  flac: null, // inferred from .flac
  mp3: 'libmp3lame',
  ogg: 'libvorbis',
  opus: 'libopus',
  aac: 'aac',
}

export function audioConvertArgs(
  input: string,
  output: string,
  target: AudioTarget,
  bitrate = 192,
): string[] {
  const codec = AUDIO_CODEC[target]
  if (!codec) return ['-i', input, output] // lossless: let the muxer pick
  return ['-i', input, '-c:a', codec, '-b:a', `${bitrate}k`, output]
}

// ── Audio editor ─────────────────────────────────────────────────────────────
// A single-pass editor: trim to the selection (sample-accurate re-encode, unlike
// the keyframe-snapped video trim) plus a composable `-af` filter chain. Output
// format follows the input filename, so the muxer picks the codec.

export interface AudioEditOptions {
  /** Trim in/out, absolute seconds from file start. 0 / undefined = no edge. */
  start?: number
  end?: number
  /** EBU R128 loudness normalize. */
  normalize?: boolean
  /** Gain in dB (0 = none). */
  gainDb?: number
  /** Fade durations in seconds (0 = none). */
  fadeIn?: number
  fadeOut?: number
  /** Playback speed (1 = none); tempo only, pitch unchanged. */
  speed?: number
  reverse?: boolean
  /** Strip leading/trailing silence. */
  trimSilence?: boolean
}

// atempo only accepts 0.5–2.0, so reach further by chaining factors (e.g. 4× →
// atempo=2,atempo=2). Returns one filter string per factor.
export function atempoChain(speed: number): string[] {
  let remaining = speed
  const factors: number[] = []
  while (remaining > 2) {
    factors.push(2)
    remaining /= 2
  }
  while (remaining < 0.5) {
    factors.push(0.5)
    remaining *= 2
  }
  factors.push(Number(remaining.toFixed(4)))
  return factors.map((f) => `atempo=${f}`)
}

// Build the ordered `-af` filter list from the requested effects. Order matters:
// silence-trim and tempo (which change duration) come first, then reverse, then
// fades (timed against the post-trim/tempo length), then gain, then normalize.
export function audioFilterChain(opts: AudioEditOptions): string[] {
  const filters: string[] = []
  if (opts.trimSilence) {
    filters.push(
      'silenceremove=start_periods=1:start_threshold=-50dB:stop_periods=1:stop_threshold=-50dB',
    )
  }
  const speed = opts.speed ?? 1
  if (speed !== 1) filters.push(...atempoChain(speed))
  if (opts.reverse) filters.push('areverse')
  if (opts.fadeIn && opts.fadeIn > 0) filters.push(`afade=t=in:st=0:d=${opts.fadeIn}`)
  if (opts.fadeOut && opts.fadeOut > 0) {
    // Fade-out start = selection length scaled by tempo, minus the fade. (Doesn't
    // account for any silence removed upstream — an acceptable edge case.)
    const span = Math.max(0, (opts.end ?? 0) - (opts.start ?? 0))
    const dur = span > 0 ? span / speed : 0
    const st = Math.max(0, Number((dur - opts.fadeOut).toFixed(3)))
    filters.push(`afade=t=out:st=${st}:d=${opts.fadeOut}`)
  }
  if (opts.gainDb) filters.push(`volume=${opts.gainDb}dB`)
  if (opts.normalize) filters.push('loudnorm')
  return filters
}

export function audioEditArgs(input: string, output: string, opts: AudioEditOptions): string[] {
  const args = ['-i', input]
  if (opts.start && opts.start > 0) args.push('-ss', String(opts.start))
  if (opts.end && opts.end > 0) args.push('-to', String(opts.end))
  const chain = audioFilterChain(opts)
  if (chain.length) args.push('-af', chain.join(','))
  args.push(output)
  return args
}

// ── Universal video converter ────────────────────────────────────────────────
// "Anything → anything": a single target picker covering common containers, GIF,
// and audio-only extraction. x264 uses -preset ultrafast since WASM transcoding
// is CPU-bound; WebM uses VP8/Vorbis (much faster than VP9 under wasm).

export type VideoTarget = 'mp4' | 'webm' | 'mkv' | 'mov' | 'gif' | 'mp3' | 'wav'

export interface VideoTargetSpec {
  id: VideoTarget
  label: string
  ext: string
  mime: string
  kind: 'video' | 'image' | 'audio'
}

export const VIDEO_TARGETS: VideoTargetSpec[] = [
  { id: 'mp4', label: 'MP4 (H.264)', ext: 'mp4', mime: 'video/mp4', kind: 'video' },
  { id: 'webm', label: 'WebM (VP8)', ext: 'webm', mime: 'video/webm', kind: 'video' },
  { id: 'mkv', label: 'MKV', ext: 'mkv', mime: 'video/x-matroska', kind: 'video' },
  { id: 'mov', label: 'MOV', ext: 'mov', mime: 'video/quicktime', kind: 'video' },
  { id: 'gif', label: 'GIF', ext: 'gif', mime: 'image/gif', kind: 'image' },
  { id: 'mp3', label: 'MP3 (audio only)', ext: 'mp3', mime: 'audio/mpeg', kind: 'audio' },
  { id: 'wav', label: 'WAV (audio only)', ext: 'wav', mime: 'audio/wav', kind: 'audio' },
]

const H264 = ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac']

export function videoConvertArgs(
  input: string,
  output: string,
  target: VideoTarget,
  opts: { fps?: number; width?: number } = {},
): string[] {
  switch (target) {
    case 'gif':
      return mp4ToGifArgs(input, output, opts.fps ?? 12, opts.width ?? 480)
    case 'mp4':
      return ['-i', input, ...H264, '-movflags', 'faststart', output]
    case 'mov':
    case 'mkv':
      return ['-i', input, ...H264, output]
    case 'webm':
      return ['-i', input, '-c:v', 'libvpx', '-c:a', 'libvorbis', output]
    case 'mp3':
      return ['-i', input, '-vn', ...MP3_ENCODE, output]
    case 'wav':
      return ['-i', input, '-vn', output]
  }
}
