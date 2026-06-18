import { customAlphabet, nanoid } from 'nanoid'

// NanoID generator. The default alphabet is URL-safe (A-Za-z0-9_-); presets cover
// common alternatives. A custom alphabet routes through customAlphabet().

export type NanoidPreset = 'urlSafe' | 'alphanumeric' | 'lowercase' | 'numbers' | 'hex'

export const PRESET_ALPHABETS: Record<Exclude<NanoidPreset, 'urlSafe'>, string> = {
  alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  hex: '0123456789abcdef',
}

export function generateNanoIds(size: number, count: number, preset: NanoidPreset): string[] {
  const n = Math.max(1, Math.min(1000, Math.floor(count) || 1))
  const len = Math.max(1, Math.min(256, Math.floor(size) || 1))
  const gen =
    preset === 'urlSafe' ? () => nanoid(len) : customAlphabet(PRESET_ALPHABETS[preset], len)
  return Array.from({ length: n }, () => gen())
}
