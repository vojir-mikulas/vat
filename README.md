# VAT — Vojir's Awesome Tools

> A collection of useful developer and media tools that run entirely in your browser.
>
> **Everything runs in your browser. No uploads, no tracking.**

VAT is a static, client-side web app: a searchable collection of small developer and
media tools. Every tool runs **100% in your browser** — nothing is uploaded, nothing is
tracked. It deploys as plain static files to any CDN or static host.

## Principles

- **Everything runs locally** — no uploads, ever.
- **Privacy first** — no tracking, no analytics that phone home.
- **Fast** — tiny base bundle; heavy dependencies are lazy-loaded per tool.
- **Mobile friendly**, **dark mode**, **keyboard-first** (⌘K launcher), **drag & drop**.
- **Open source** (Apache-2.0).

## Stack

- **Vite + React 19 + TypeScript**, pnpm
- **Tailwind 4** + **shadcn/ui** (Radix), Geist fonts — design ported from the sibling
  [`vac`](../vac) project
- **TanStack Router** (file-based) · **motion** · **sonner** · **cmdk** · **react-i18next**

## Development

```bash
pnpm install
pnpm dev            # dev server at http://localhost:5173
pnpm build          # typecheck + production build to dist/
pnpm typecheck      # tsc -b
pnpm lint           # eslint
pnpm format         # prettier --write
pnpm test           # vitest (unit tests on tool logic)
```

## Architecture

The heart of VAT is a typed **tool registry** (`src/lib/registry.ts`) — the single
source of truth that drives routing, the sidebar/landing navigation, and the ⌘K command
palette. Display strings live in the `tools` i18n namespace (`src/i18n/locales/`).

```
src/
  lib/registry.ts        the tool registry (categories + tools)
  components/
    ui/                  shadcn primitives (ported from vac)
    layout/              app-shell, sidebar, topbar, command-menu
    common/              shared widgets (copy-button, tool-host, …)
  tools/<id>/            one folder per tool
    <id>.ts              pure logic (unit-tested)
    <id>.test.ts
    <id>-tool.tsx        default-exported component
  routes/                TanStack file routes (thin — driven by the registry)
  i18n/                  react-i18next setup + en catalogs
```

### Adding a tool

1. Create `src/tools/<id>/<id>-tool.tsx` (default-exported component) and, ideally,
   a `<id>.ts` logic module with tests.
2. Add `tools:<id>.title` / `.description` (and any UI strings) to
   `src/i18n/locales/en/tools.json`.
3. Add one entry to `TOOLS` in `src/lib/registry.ts` (id, category, icon, keywords,
   `load: () => import('@/tools/<id>/<id>-tool')`).

Routing, search, and navigation pick it up automatically. The Base64 tool
(`src/tools/base64/`) is the canonical reference implementation.

See [`docs/plans/mvp.md`](docs/plans/mvp.md) for the full MVP scope and phasing.
</content>
