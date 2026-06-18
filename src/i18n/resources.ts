import common from './locales/en/common.json'
import tools from './locales/en/tools.json'

export const defaultNS = 'common'

// English is the source of truth and the fallback locale, bundled eagerly so the
// app renders synchronously (no Suspense flash). Additional locales should be
// lazy-loaded — register them with a dynamic import in index.ts so only the
// active language ships to the browser.
//
// Namespaces: `common` (app chrome, shared strings) and `tools` (category labels
// + per-tool title/description/UI strings, keyed by tool id).
export const enResources = {
  common,
  tools,
} as const

export const namespaces = Object.keys(enResources)

export const resources = { en: enResources } as const
