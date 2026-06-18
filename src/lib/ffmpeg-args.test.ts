import { describe, expect, it } from 'vitest'

import {
  audioArgs,
  audioConvertArgs,
  formatTimecode,
  frameArgs,
  gifToMp4Args,
  MP3_ENCODE,
  mp4ToGifArgs,
  parseTime,
  trimArgs,
  videoConvertArgs,
} from './ffmpeg-args'

describe('parseTime', () => {
  it('parses plain seconds and fractions', () => {
    expect(parseTime('12')).toBe(12)
    expect(parseTime('1.5')).toBe(1.5)
  })
  it('parses mm:ss and hh:mm:ss', () => {
    expect(parseTime('1:23')).toBe(83)
    expect(parseTime('1:00:00')).toBe(3600)
    expect(parseTime('0:01.5')).toBe(1.5)
  })
  it('rejects empty and malformed input', () => {
    expect(parseTime('')).toBeNull()
    expect(parseTime('abc')).toBeNull()
    expect(parseTime('1:2:3:4')).toBeNull()
  })
})

describe('formatTimecode', () => {
  it('formats sub-hour and over-hour times', () => {
    expect(formatTimecode(0)).toBe('0:00.0')
    expect(formatTimecode(83.5)).toBe('1:23.5')
    expect(formatTimecode(3661)).toBe('1:01:01.0')
  })
  it('clamps negatives and non-finite to zero', () => {
    expect(formatTimecode(-5)).toBe('0:00.0')
    expect(formatTimecode(NaN)).toBe('0:00.0')
  })
})

describe('ffmpeg arg builders', () => {
  it('builds GIF conversion args', () => {
    expect(mp4ToGifArgs('in.mp4', 'out.gif', 12, 480)).toEqual([
      '-i',
      'in.mp4',
      '-vf',
      'fps=12,scale=480:-1:flags=lanczos',
      '-loop',
      '0',
      'out.gif',
    ])
  })
  it('builds GIF→MP4 args with yuv420p', () => {
    expect(gifToMp4Args('in.gif', 'out.mp4')).toContain('yuv420p')
  })
  it('builds frame-extract args', () => {
    expect(frameArgs('in.mp4', 'out.png', 5)).toEqual([
      '-ss',
      '5',
      '-i',
      'in.mp4',
      '-frames:v',
      '1',
      'out.png',
    ])
  })
  it('builds trim args with stream copy', () => {
    expect(trimArgs('in.mp4', 'out.mp4', 2, 8)).toEqual([
      '-i',
      'in.mp4',
      '-ss',
      '2',
      '-to',
      '8',
      '-c',
      'copy',
      'out.mp4',
    ])
  })
  it('builds video-converter args per target', () => {
    expect(videoConvertArgs('in.mov', 'out.mp4', 'mp4')).toContain('libx264')
    expect(videoConvertArgs('in.mp4', 'out.webm', 'webm')).toContain('libvpx')
    expect(videoConvertArgs('in.mp4', 'out.gif', 'gif', { fps: 10, width: 320 })).toContain(
      'fps=10,scale=320:-1:flags=lanczos',
    )
    expect(videoConvertArgs('in.mp4', 'out.mp3', 'mp3')).toEqual(
      expect.arrayContaining(['-vn', 'libmp3lame']),
    )
    expect(videoConvertArgs('in.mp4', 'out.wav', 'wav')).toContain('-vn')
  })

  it('builds audio-converter args (lossy with bitrate, lossless bare)', () => {
    expect(audioConvertArgs('in.flac', 'out.mp3', 'mp3', 256)).toEqual([
      '-i',
      'in.flac',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '256k',
      'out.mp3',
    ])
    expect(audioConvertArgs('in.mp3', 'out.wav', 'wav')).toEqual(['-i', 'in.mp3', 'out.wav'])
    expect(audioConvertArgs('in.wav', 'out.flac', 'flac')).toEqual(['-i', 'in.wav', 'out.flac'])
    expect(audioConvertArgs('in.wav', 'out.opus', 'opus')).toContain('libopus')
  })

  it('builds audio args with and without an encoder', () => {
    expect(audioArgs('in.mp3', 'out.wav')).toEqual(['-i', 'in.mp3', 'out.wav'])
    expect(audioArgs('in.wav', 'out.mp3', MP3_ENCODE)).toEqual([
      '-i',
      'in.wav',
      '-codec:a',
      'libmp3lame',
      '-q:a',
      '2',
      'out.mp3',
    ])
  })
})
