import type { ComponentType } from 'react'
import {
  Archive,
  Binary,
  FileText,
  Image,
  Music,
  ShieldCheck,
  Terminal,
  Type,
  Video,
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
] as const

// ── Lookups ──────────────────────────────────────────────────────────────────

export function getCategory(id: string): ToolCategory | undefined {
  return CATEGORIES.find((c) => c.id === id)
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
