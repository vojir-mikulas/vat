import type { ComponentType } from 'react'
import {
  Archive,
  ArrowRightLeft,
  AudioWaveform,
  Binary,
  Braces,
  CalendarClock,
  Camera,
  Clapperboard,
  Clock,
  Code,
  Columns2,
  Database,
  Eraser,
  Fingerprint,
  FileArchive,
  FileAudio,
  FileCheck,
  Files,
  FileText,
  FileVideo,
  Hash,
  Image,
  Info,
  Package,
  PackageOpen,
  Scissors,
  Shrink,
  KeyRound,
  KeySquare,
  FileBadge,
  Link,
  Lock,
  Minimize2,
  Music,
  Palette,
  Pilcrow,
  QrCode,
  Regex,
  Replace,
  ScanQrCode,
  ShieldCheck,
  Smartphone,
  Tags,
  Terminal,
  Type,
  Video,
  Wand2,
  type LucideIcon,
} from 'lucide-react'

// ── The tool registry ──────────────────────────────────────────────────────
// Single source of truth for every tool. It drives routing, the sidebar/landing
// navigation, and the ⌘K command palette. Adding a tool = add one entry here +
// one lazy-loaded component under src/tools/<id>/. Nothing else to wire up.
//
// Display strings (title, description, category labels) are NOT stored here —
// they live in the `tools` i18n namespace, keyed by id (`tools:<id>.title`) and
// category (`tools:category.<id>`). The registry holds only structure + search
// metadata. Resolve text via the useToolText() hook (src/lib/use-tool-text.ts).

export const CATEGORY_IDS = [
  'text',
  'developer',
  'images',
  'video',
  'audio',
  'files',
  'pdf',
  'security',
] as const

export type ToolCategoryId = (typeof CATEGORY_IDS)[number]

export interface ToolCategory {
  id: ToolCategoryId
  icon: LucideIcon
}

export const CATEGORIES: readonly ToolCategory[] = [
  { id: 'text', icon: Type },
  { id: 'developer', icon: Terminal },
  { id: 'images', icon: Image },
  { id: 'video', icon: Video },
  { id: 'audio', icon: Music },
  { id: 'files', icon: Archive },
  { id: 'pdf', icon: FileText },
  { id: 'security', icon: ShieldCheck },
] as const

export type ToolStatus = 'ready' | 'wip'

export interface Tool {
  /** URL slug + i18n key under the `tools` namespace (`tools:<id>.title`). */
  id: string
  category: ToolCategoryId
  icon: LucideIcon
  /** Extra search aliases for the command palette (English; not user-visible). */
  keywords: string[]
  status: ToolStatus
  /** Code-split entry — dynamically imported the first time the tool is opened. */
  load: () => Promise<{ default: ComponentType }>
}

export const TOOLS: readonly Tool[] = [
  {
    id: 'base64',
    category: 'text',
    icon: Binary,
    keywords: ['base64', 'encode', 'decode', 'b64', 'atob', 'btoa'],
    status: 'ready',
    load: () => import('@/tools/base64/base64-tool'),
  },
  {
    id: 'url',
    category: 'text',
    icon: Link,
    keywords: ['url', 'uri', 'encode', 'decode', 'percent', 'escape', 'querystring'],
    status: 'ready',
    load: () => import('@/tools/url/url-tool'),
  },
  {
    id: 'html',
    category: 'text',
    icon: Code,
    keywords: ['html', 'entities', 'encode', 'decode', 'escape', 'unescape', 'amp', 'lt', 'gt'],
    status: 'ready',
    load: () => import('@/tools/html-entities/html-entities-tool'),
  },
  {
    id: 'jwt',
    category: 'developer',
    icon: KeyRound,
    keywords: ['jwt', 'token', 'jose', 'decode', 'json web token', 'claims', 'bearer'],
    status: 'ready',
    load: () => import('@/tools/jwt/jwt-tool'),
  },
  {
    id: 'json',
    category: 'text',
    icon: Braces,
    keywords: ['json', 'format', 'beautify', 'pretty', 'minify', 'prettify', 'validate'],
    status: 'ready',
    load: () => import('@/tools/json-format/json-format-tool'),
  },
  {
    id: 'json-yaml',
    category: 'text',
    icon: ArrowRightLeft,
    keywords: ['json', 'yaml', 'yml', 'convert', 'transform'],
    status: 'ready',
    load: () => import('@/tools/json-yaml/json-yaml-tool'),
  },
  {
    id: 'markdown',
    category: 'text',
    icon: Hash,
    keywords: ['markdown', 'md', 'preview', 'render', 'gfm', 'html'],
    status: 'ready',
    load: () => import('@/tools/markdown/markdown-tool'),
  },
  {
    id: 'diff',
    category: 'text',
    icon: Columns2,
    keywords: ['diff', 'compare', 'difference', 'changes', 'text', 'merge'],
    status: 'ready',
    load: () => import('@/tools/diff/diff-tool'),
  },
  {
    id: 'lorem',
    category: 'text',
    icon: Pilcrow,
    keywords: ['lorem', 'ipsum', 'placeholder', 'dummy', 'filler', 'text', 'generator'],
    status: 'ready',
    load: () => import('@/tools/lorem/lorem-tool'),
  },
  {
    id: 'uuid',
    category: 'developer',
    icon: Fingerprint,
    keywords: ['uuid', 'guid', 'unique', 'id', 'v4', 'v7', 'generator'],
    status: 'ready',
    load: () => import('@/tools/uuid/uuid-tool'),
  },
  {
    id: 'nanoid',
    category: 'developer',
    icon: Tags,
    keywords: ['nanoid', 'id', 'unique', 'short', 'generator'],
    status: 'ready',
    load: () => import('@/tools/nanoid/nanoid-tool'),
  },
  {
    id: 'password',
    category: 'developer',
    icon: Lock,
    keywords: ['password', 'passphrase', 'random', 'secret', 'generator', 'secure'],
    status: 'ready',
    load: () => import('@/tools/password/password-tool'),
  },
  {
    id: 'hash',
    category: 'developer',
    icon: Hash,
    keywords: ['hash', 'md5', 'sha1', 'sha256', 'sha512', 'checksum', 'digest'],
    status: 'ready',
    load: () => import('@/tools/hash/hash-tool'),
  },
  {
    id: 'hmac',
    category: 'developer',
    icon: KeySquare,
    keywords: ['hmac', 'mac', 'sha256', 'signature', 'keyed', 'hash'],
    status: 'ready',
    load: () => import('@/tools/hmac/hmac-tool'),
  },
  {
    id: 'timestamp',
    category: 'developer',
    icon: Clock,
    keywords: ['timestamp', 'unix', 'epoch', 'date', 'time', 'iso', 'convert'],
    status: 'ready',
    load: () => import('@/tools/timestamp/timestamp-tool'),
  },
  {
    id: 'cron',
    category: 'developer',
    icon: CalendarClock,
    keywords: ['cron', 'crontab', 'schedule', 'expression', 'next', 'job'],
    status: 'ready',
    load: () => import('@/tools/cron/cron-tool'),
  },
  {
    id: 'regex',
    category: 'developer',
    icon: Regex,
    keywords: ['regex', 'regexp', 'regular expression', 'match', 'test', 'pattern'],
    status: 'ready',
    load: () => import('@/tools/regex/regex-tool'),
  },
  {
    id: 'sql',
    category: 'developer',
    icon: Database,
    keywords: ['sql', 'format', 'beautify', 'prettify', 'query', 'database'],
    status: 'ready',
    load: () => import('@/tools/sql/sql-tool'),
  },
  {
    id: 'color',
    category: 'developer',
    icon: Palette,
    keywords: ['color', 'colour', 'hex', 'rgb', 'hsl', 'convert', 'picker'],
    status: 'ready',
    load: () => import('@/tools/color/color-tool'),
  },
  {
    id: 'image-convert',
    category: 'images',
    icon: Replace,
    keywords: ['image', 'convert', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'format'],
    status: 'ready',
    load: () => import('@/tools/image-convert/image-convert-tool'),
  },
  {
    id: 'image-editor',
    category: 'images',
    icon: Wand2,
    keywords: [
      'image',
      'editor',
      'edit',
      'crop',
      'resize',
      'scale',
      'rotate',
      'flip',
      'mirror',
      'transform',
      'dimensions',
      'width',
      'height',
    ],
    status: 'ready',
    load: () => import('@/tools/image-editor/image-editor-tool'),
  },
  {
    id: 'image-compress',
    category: 'images',
    icon: Minimize2,
    keywords: ['image', 'compress', 'optimize', 'shrink', 'quality', 'size'],
    status: 'ready',
    load: () => import('@/tools/image-compress/image-compress-tool'),
  },
  {
    id: 'image-exif',
    category: 'images',
    icon: Eraser,
    keywords: ['image', 'exif', 'metadata', 'strip', 'remove', 'privacy', 'gps'],
    status: 'ready',
    load: () => import('@/tools/image-exif/image-exif-tool'),
  },
  {
    id: 'image-metadata',
    category: 'images',
    icon: Info,
    keywords: ['image', 'metadata', 'exif', 'info', 'inspect', 'gps', 'camera'],
    status: 'ready',
    load: () => import('@/tools/image-metadata/image-metadata-tool'),
  },
  {
    id: 'zip',
    category: 'files',
    icon: FileArchive,
    keywords: ['zip', 'archive', 'compress', 'create', 'bundle'],
    status: 'ready',
    load: () => import('@/tools/zip/zip-tool'),
  },
  {
    id: 'unzip',
    category: 'files',
    icon: PackageOpen,
    keywords: ['unzip', 'extract', 'zip', 'archive', 'decompress'],
    status: 'ready',
    load: () => import('@/tools/unzip/unzip-tool'),
  },
  {
    id: 'tar',
    category: 'files',
    icon: Package,
    keywords: ['tar', 'tarball', 'extract', 'gz', 'gzip', 'tgz', 'archive'],
    status: 'ready',
    load: () => import('@/tools/tar/tar-tool'),
  },
  {
    id: 'checksum',
    category: 'files',
    icon: FileCheck,
    keywords: ['checksum', 'hash', 'md5', 'sha', 'verify', 'integrity', 'digest'],
    status: 'ready',
    load: () => import('@/tools/checksum/checksum-tool'),
  },
  {
    id: 'file-compare',
    category: 'files',
    icon: Files,
    keywords: ['compare', 'diff', 'files', 'identical', 'binary', 'equal'],
    status: 'ready',
    load: () => import('@/tools/file-compare/file-compare-tool'),
  },
  {
    id: 'pdf-editor',
    category: 'pdf',
    icon: Wand2,
    keywords: [
      'pdf',
      'editor',
      'edit',
      'organize',
      'merge',
      'combine',
      'reorder',
      'rearrange',
      'rotate',
      'delete',
      'remove',
      'pages',
      'split',
      'extract',
    ],
    status: 'ready',
    load: () => import('@/tools/pdf-editor/pdf-editor-tool'),
  },
  {
    id: 'pdf-compress',
    category: 'pdf',
    icon: Shrink,
    keywords: ['pdf', 'compress', 'optimize', 'shrink', 'size'],
    status: 'ready',
    load: () => import('@/tools/pdf-compress/pdf-compress-tool'),
  },
  {
    id: 'qr-generate',
    category: 'security',
    icon: QrCode,
    keywords: ['qr', 'qrcode', 'generate', 'barcode', 'create'],
    status: 'ready',
    load: () => import('@/tools/qr-generate/qr-generate-tool'),
  },
  {
    id: 'qr-read',
    category: 'security',
    icon: ScanQrCode,
    keywords: ['qr', 'qrcode', 'read', 'scan', 'decode'],
    status: 'ready',
    load: () => import('@/tools/qr-read/qr-read-tool'),
  },
  {
    id: 'otp',
    category: 'security',
    icon: Smartphone,
    keywords: ['otp', 'totp', 'hotp', '2fa', 'mfa', 'otpauth', 'authenticator'],
    status: 'ready',
    load: () => import('@/tools/otp/otp-tool'),
  },
  {
    id: 'certificate',
    category: 'security',
    icon: FileBadge,
    keywords: ['certificate', 'x509', 'ssl', 'tls', 'pem', 'crt', 'cert'],
    status: 'ready',
    load: () => import('@/tools/certificate/certificate-tool'),
  },
  {
    id: 'video-editor',
    category: 'video',
    icon: Clapperboard,
    keywords: [
      'video',
      'editor',
      'timeline',
      'trim',
      'cut',
      'clip',
      'frame',
      'extract',
      'filmstrip',
      'waveform',
      'premiere',
      'vegas',
      'ffmpeg',
    ],
    status: 'ready',
    load: () => import('@/tools/video-editor/video-editor-tool'),
  },
  {
    id: 'video-convert',
    category: 'video',
    icon: FileVideo,
    keywords: [
      'video',
      'convert',
      'mp4',
      'webm',
      'mkv',
      'mov',
      'gif',
      'mp3',
      'wav',
      'transcode',
      'ffmpeg',
    ],
    status: 'ready',
    load: () => import('@/tools/video-convert/video-convert-tool'),
  },
  {
    id: 'video-frame',
    category: 'video',
    icon: Camera,
    keywords: ['video', 'frame', 'extract', 'screenshot', 'thumbnail', 'still', 'ffmpeg'],
    status: 'ready',
    load: () => import('@/tools/video-frame/video-frame-tool'),
  },
  {
    id: 'video-trim',
    category: 'video',
    icon: Scissors,
    keywords: ['video', 'trim', 'cut', 'clip', 'split', 'ffmpeg'],
    status: 'ready',
    load: () => import('@/tools/video-trim/video-trim-tool'),
  },
  {
    id: 'audio-convert',
    category: 'audio',
    icon: FileAudio,
    keywords: [
      'audio',
      'convert',
      'mp3',
      'wav',
      'flac',
      'ogg',
      'opus',
      'aac',
      'm4a',
      'transcode',
      'ffmpeg',
    ],
    status: 'ready',
    load: () => import('@/tools/audio-convert/audio-convert-tool'),
  },
  {
    id: 'audio-editor',
    category: 'audio',
    icon: AudioWaveform,
    keywords: [
      'audio',
      'editor',
      'audacity',
      'trim',
      'cut',
      'fade',
      'normalize',
      'volume',
      'gain',
      'speed',
      'reverse',
      'silence',
      'waveform',
      'ffmpeg',
    ],
    status: 'ready',
    load: () => import('@/tools/audio-editor/audio-editor-tool'),
  },
] as const

// ── Lookups ──────────────────────────────────────────────────────────────────

export function getCategory(id: string): ToolCategory | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

/**
 * The CSS accent color for a category, e.g. `var(--cat-text)`. Set it on an
 * element's `--cat` custom property (inline style) so descendant utilities like
 * `text-[var(--cat)]` resolve to that category's hue. Tokens live in index.css
 * and track light/dark automatically.
 */
export function categoryAccent(id: string): string {
  return `var(--cat-${id})`
}

export function getTool(categoryId: string, toolId: string): Tool | undefined {
  return TOOLS.find((t) => t.category === categoryId && t.id === toolId)
}

export function getToolById(toolId: string): Tool | undefined {
  return TOOLS.find((t) => t.id === toolId)
}

export function toolsInCategory(categoryId: string): Tool[] {
  return TOOLS.filter((t) => t.category === categoryId)
}

/** Path to a tool's page, e.g. `/text/base64`. */
export function toolPath(tool: Tool): string {
  return `/${tool.category}/${tool.id}`
}
