# VAT — Vojir's Awesome Tools

> A collection of useful developer and media tools that run entirely in your browser.
>
> **No uploads. No tracking. No bullshit.**

This document is the MVP plan: it captures **what** we're building, the **stack** we
agreed on, the **architecture**, and the **phasing**. It is point-in-time intent — once
the code exists, source is the source of truth.

---

## 1. What VAT is

A static, client-side web app: a searchable collection of small developer/media tools.
Every tool runs **100% in the browser** — no backend, no uploads, no telemetry. The whole
thing deploys as static files (any CDN / static host).

Design is **heavily inspired by `vac`** (the sibling PaaS project): we port its Tailwind 4
OKLCH theme, shadcn/ui component set, Geist fonts, and overall visual language. Where `vac`
has a Go backend + live data, VAT has **none** — it's pure front-end.

---

## 2. Stack

| Layer            | Choice                                                | Notes                                                  |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| Language / build | **TypeScript + Vite + React 19**                      | same as `vac`                                          |
| Package manager  | **pnpm 10**                                           |                                                        |
| Styling          | **Tailwind 4** (CSS-first `@theme`)                   | port `vac`'s `index.css` token palette verbatim        |
| Components       | **shadcn/ui** (new-york, neutral base) + **Radix UI** | reuse `vac`'s `components/ui/*`                        |
| Fonts            | **Geist Sans / Geist Mono** via `@fontsource`         | self-hosted, no CDN                                    |
| Icons            | **lucide-react**                                      |                                                        |
| Routing          | **TanStack Router** (file-based, autoCodeSplitting)   | one route per tool, generated tree                     |
| Animation        | **motion** (LazyMotion + `m.*`)                       | match `vac`                                            |
| Theme toggle     | **next-themes**                                       | light / dark / system                                  |
| Toasts           | **sonner**                                            |                                                        |
| Command palette  | **cmdk**                                              | fuzzy tool launcher (⌘K) — driven by the tool registry |
| Lint / format    | **ESLint + Prettier**                                 | port `vac` config; add `eslint-plugin-jsx-a11y`        |
| Tests            | **Vitest** + Testing Library                          | unit tests on tool logic (pure functions)              |

### Per-tool libraries (lazy-loaded where heavy)

| Domain                                             | Library                                                         |
| -------------------------------------------------- | --------------------------------------------------------------- |
| Hashing / HMAC                                     | **hash-wasm** (MD5, SHA-1/256/512, HMAC — WebCrypto has no MD5) |
| UUID / NanoID                                      | `crypto.randomUUID()` + **nanoid**                              |
| JSON ↔ YAML                                        | **js-yaml**                                                     |
| Markdown preview                                   | **marked** + **dompurify**                                      |
| Diff viewer                                        | **diff** (jsdiff)                                               |
| JWT decode                                         | native base64url + JSON (no verify in MVP)                      |
| Cron parser                                        | **cronstrue** + **cron-parser**                                 |
| SQL formatter                                      | **sql-formatter**                                               |
| Color convert                                      | **colord**                                                      |
| Images (convert/resize/crop/rotate/compress)       | **Canvas API** (native)                                         |
| EXIF read/strip                                    | **exifr**                                                       |
| ZIP / Unzip / TAR                                  | **fflate**                                                      |
| PDF (merge/split/rotate/extract)                   | **pdf-lib**                                                     |
| PDF render/preview                                 | **pdfjs-dist** (lazy)                                           |
| QR generate                                        | **qrcode.react**                                                |
| QR read                                            | **jsqr**                                                        |
| Video / Audio (mp4↔gif, trim, frame, mp3/wav/flac) | **@ffmpeg/ffmpeg** (WASM, lazy, cross-origin-isolated)          |

> **Bundle policy:** the base app loads only the registry + shell. ffmpeg.wasm,
> pdfjs, and other heavy modules are dynamically imported the first time their tool
> is opened, so the landing experience stays fast.

---

## 3. Architecture

### Tool registry — the single source of truth

Every tool is described once in a typed registry. The registry drives routing, the
category navigation, the command palette, and search. Adding a tool = add a registry
entry + a lazy component.

```ts
type ToolCategory =
  | 'text'
  | 'developer'
  | 'images'
  | 'video'
  | 'audio'
  | 'files'
  | 'pdf'
  | 'security'

interface Tool {
  id: string // 'base64', 'uuid', …  (URL slug + i18n key)
  title: string
  description: string
  category: ToolCategory
  icon: LucideIcon
  keywords: string[] // fuzzy-search aliases ('encode', 'b64', …)
  status: 'ready' | 'wip'
  load: () => Promise<{ default: ComponentType }> // code-split entry
}
```

### Layout

Port `vac`'s shell: floating-card **sidebar** (categories) + **topbar** with the ⌘K
search trigger. A `PageContainer` / `PageHeader` pair for consistent tool pages. Each tool
renders inside a shared `<ToolLayout>` giving it a title, description, and a slot for
input/output panes.

### Folder layout

```
vat/
  docs/plans/            this file + phase plans
  ui/                    (or repo root — single package, no monorepo needed)
    src/
      components/
        ui/              shadcn primitives (ported from vac)
        layout/          app-shell, sidebar, topbar, command-menu
        common/          shared tool widgets (copy-button, dropzone, code-pane, …)
      tools/             one folder per tool: <tool>/index.tsx + <tool>.ts (pure logic) + test
      lib/
        registry.ts      the tool registry
        utils.ts         cn(), etc.
      routes/            TanStack file routes (thin — delegate to tools/)
      index.css          ported vac theme
      main.tsx
```

> Single package (just `ui/`) — VAT has no backend, so the `vac`-style monorepo with
> `api/` + `proxy/` is unnecessary. We can flatten to repo root if preferred.

### Shared tool primitives (`components/common/`)

Built once, reused everywhere: `CopyButton`, `Dropzone` (drag & drop), `FileResult`
(download), `CodePane` (mono input/output with copy), `BeforeAfter` (two-pane), and an
`<input ↔ output>` swap control. These embody the principles (drag & drop everywhere,
copy/keyboard shortcuts).

---

## 4. Tools & phasing

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done.

### Phase 0 — Foundations

- [x] Scaffold Vite + React 19 + TS, pnpm
- [x] Port `vac` theme (`index.css`), Geist fonts, shadcn `components/ui`
- [x] App shell: sidebar (categories), topbar, ⌘K command menu, dark mode
- [x] Tool registry + routing + search wiring
- [~] Shared `common/` primitives — `CopyButton` + `ToolHost`/`PageHeader` done;
  `Dropzone` / `CodePane` / `FileResult` land with the tools that need them
- [x] Home / landing page (category grid)
- [x] i18n setup (react-i18next, `common` + `tools` namespaces, English)
- [x] Base64 reference tool (`src/tools/base64/`) — validates the full
      registry → routing → command-menu → lazy-load pipeline end to end

### Phase 1 — Text (pure, zero heavy deps — ship first)

- [x] Base64 Encode / Decode
- [x] URL Encode / Decode
- [x] HTML Encode / Decode
- [x] JWT Decoder
- [x] JSON Formatter
- [x] JSON ↔ YAML
- [x] Markdown Preview
- [x] Diff Viewer
- [x] Lorem Ipsum Generator

### Phase 2 — Developer

- [ ] UUID Generator
- [ ] NanoID Generator
- [ ] Password Generator
- [ ] Hash Generator (MD5 / SHA1 / SHA256 / SHA512)
- [ ] HMAC Generator
- [ ] Timestamp Converter (Unix ↔ Human)
- [ ] Cron Parser
- [ ] Regex Tester
- [ ] SQL Formatter
- [ ] Color Converter (HEX / RGB / HSL)

### Phase 3 — Images (Canvas API)

- [ ] JPG → PNG
- [ ] PNG → JPG
- [ ] WEBP ↔ PNG
- [ ] AVIF ↔ PNG
- [ ] Resize
- [ ] Crop
- [ ] Rotate
- [ ] Compress
- [ ] Remove EXIF
- [ ] Image Metadata Viewer

### Phase 4 — Files

- [ ] ZIP
- [ ] Unzip
- [ ] TAR Extract
- [ ] File Checksum
- [ ] Compare Files

### Phase 5 — PDF

- [ ] Merge PDF
- [ ] Split PDF
- [ ] Compress PDF
- [ ] Rotate Pages
- [ ] Extract Pages

### Phase 6 — Security

- [ ] QR Code Generator
- [ ] QR Code Reader
- [ ] OTP URI Parser
- [ ] Certificate Viewer

### Phase 7 — Video / Audio (ffmpeg.wasm — heavy, gated behind lazy load + COOP/COEP)

- [ ] MP4 → GIF
- [ ] GIF → MP4
- [ ] Extract Frame
- [ ] Trim Video
- [ ] MP3 → WAV
- [ ] WAV → MP3
- [ ] FLAC → MP3

> **Why video/audio last:** ffmpeg.wasm requires cross-origin isolation (COOP/COEP
> headers) and a multi-MB download. We validate the registry/shell/UX on the cheap
> text+dev tools first, then take on the WASM-heavy domains.

---

## 5. Future (post-MVP)

- ffmpeg.wasm advanced (video compression, audio normalize)
- OCR (Tesseract WASM)
- SVG Optimizer · SVG ↔ PNG · Image Background Removal
- EPUB Tools · CSV Viewer · XML / TOML / INI Formatter
- Docker Compose Validator · HTTP Request Builder · CURL Generator · OpenAPI Viewer

---

## 6. Principles (product invariants)

- **Everything runs locally** — no uploads, ever. (No `fetch` of user data to a server.)
- **Privacy first** — no tracking, no analytics that phone home.
- **Mobile friendly** — responsive from the sidebar down.
- **Fast** — tiny base bundle; heavy deps lazy-loaded per tool.
- **Open source.**
- **Keyboard shortcuts** where possible (⌘K launcher, per-tool actions).
- **Drag & drop everywhere** — every file tool accepts a drop.
- **Dark mode** — light / dark / system via next-themes.

---

## 7. Non-goals (MVP)

- No accounts, no persistence beyond `localStorage` (recent tools, preferences).
- No JWT/cert _verification_ against trust stores (decode/view only).
- No server-side anything.
  </content>
  </invoke>
