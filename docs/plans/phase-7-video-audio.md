# Phase 7 — Video / Audio (ffmpeg.wasm)

> Plan only — not yet implemented. This phase is heavier and operationally
> different from Phases 0–6: it ships a multi-MB WASM core and (optionally) touches
> SharedArrayBuffer / cross-origin isolation. Read the decisions before coding.

## 1. SharedArrayBuffer — is it safe? (decision)

**Yes, safe — but gated.** Since Spectre, browsers only expose `SharedArrayBuffer`
(and `crossOriginIsolated === true`) when the document is **cross-origin isolated**:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp` (or `credentialless`)

That gating *is* the security mitigation, so using SAB under isolation is the
sanctioned, safe path. Support is broad (Chrome, Firefox, Edge, Safari ≥15.2).

The real cost is **operational, not security**:

| Concern | Impact on VAT |
|---|---|
| COEP blocks cross-origin subresources lacking CORP/CORS | **Low** — VAT loads nothing external (self-hosted fonts, no analytics). |
| Needs server headers (COOP/COEP) | Pure static hosts (GitHub Pages) can't set them → need Netlify/Vercel/CF Pages **or** a `coi-serviceworker` shim. |
| Isolation is document-level, not per-route | Enabling it affects all 39 existing tools. |

### Decision: single-threaded core by default

ffmpeg.wasm offers two cores:

- **`@ffmpeg/core` (single-threaded)** — **no SAB, no isolation, no headers.** Works
  on any static host. Slower (no threads). **← our default.**
- `@ffmpeg/core-mt` (multi-threaded) — requires SAB + COOP/COEP. Faster.

**Plan:** ship single-threaded so Phase 7 deploys anywhere and never weakens the
rest of the app. Detect `crossOriginIsolated` at runtime and *optionally* load the
MT core as progressive enhancement when isolation is already present (e.g. the
operator configured headers). Never *require* isolation.

> If we later want MT everywhere, the lowest-friction route is `coi-serviceworker`
> (injects COOP/COEP client-side) — but that's a follow-up, not MVP.

## 2. Architecture

```
src/lib/ffmpeg.ts          singleton loader: load core once, cache the FFmpeg instance,
                           expose run(args, inFile, outFile) + progress events
src/lib/use-ffmpeg.ts      hook: { ready, loading, progress, error, run }
src/components/common/
  media-result.tsx         output preview (<video>/<audio>/<img>) + size + download
  ffmpeg-gate.tsx          shared "first use downloads ~30 MB core" loading/empty state
src/tools/<id>/            one folder per tool; each builds an ffmpeg arg list
```

Key points:

- **Lazy everything.** The ffmpeg core (~30 MB) downloads only on first use of a
  video/audio tool — never in the base bundle. Gate behind an explicit
  "Preparing media engine…" state with a progress bar.
- **Singleton instance.** Load the core once and reuse it across tools (and across
  conversions) — don't re-download per tool. Cache via the browser HTTP cache;
  consider Cache Storage for the wasm/core assets.
- **Core assets** served same-origin (`/ffmpeg/...` under `public/` or a versioned
  CDN with CORP headers). Self-host to honor the privacy-first principle.
- **Pin versions** of `@ffmpeg/ffmpeg`, `@ffmpeg/core`, `@ffmpeg/util` together —
  the API and core URLs are version-coupled.

## 3. Dev server headers (for optional MT testing)

`vite.config.ts` dev server can send the isolation headers so MT can be tried
locally without affecting production:

```ts
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  },
}
```

Not required for the single-threaded default. Document the prod header config in
the README for hosts that opt into MT.

## 4. UX / bundle

- First-open flow: tool shows a Dropzone; on file + action, if the engine isn't
  loaded, show progress while the core downloads, then run.
- Per-job progress via ffmpeg's `progress` callback (0–100%).
- Output via a shared `MediaResult` (preview + size + download), mirroring
  `ImageResult`.
- Hard cap input size with a friendly warning (browser memory is finite; large
  videos can OOM the wasm heap). Suggest a sensible MB limit.

## 5. Tools & ffmpeg recipes

Each tool = Dropzone + options + an arg list passed to `run()`. Indicative args:

| Tool | id | Sketch |
|---|---|---|
| MP4 → GIF | `mp4-to-gif` | palettegen/paletteuse for quality; fps + width controls |
| GIF → MP4 | `gif-to-mp4` | `-movflags faststart -pix_fmt yuv420p` |
| Extract Frame | `video-frame` | `-ss <time> -frames:v 1 out.png` |
| Trim Video | `video-trim` | `-ss <start> -to <end> -c copy` (stream copy when possible) |
| MP3 → WAV | `mp3-to-wav` | `-f wav` |
| WAV → MP3 | `wav-to-mp3` | `-codec:a libmp3lame -q:a 2` |
| FLAC → MP3 | `flac-to-mp3` | `-codec:a libmp3lame -q:a 2` |

Shared concerns: input filename → output filename mapping, time parsing
(`mm:ss(.ms)` ↔ seconds), and arg construction.

## 6. Testing strategy

ffmpeg.wasm **cannot be unit-tested headlessly** (no wasm core in vitest/jsdom).
So:

- **Unit-test the pure helpers only:** time-string parsing/formatting, ffmpeg
  arg-list builders (assert exact arg arrays), filename/extension mapping.
- **The transcoding itself is verified manually in a real browser** — this is the
  first phase that genuinely needs a click-through. Plan a manual checklist:
  load engine, run each conversion on a small sample, confirm playable output +
  download.
- Keep the arg builders in `*.ts` modules (like every other tool's logic) so the
  testable surface stays maximal.

## 7. Risks & open questions

- **Memory/OOM** on large files — needs an input cap + clear messaging.
- **libmp3lame / encoder availability** depends on the chosen core build; confirm
  the default `@ffmpeg/core` bundles the needed encoders, else pick a build that
  does. Verify before committing to the audio tools.
- **Core hosting size** (~30 MB) — self-hosted under `public/` inflates the deploy
  artifact; document it. Lazy + cached so users download once.
- **Single-thread speed** — set expectations in the UI ("runs locally, may take a
  moment"). MT remains an opt-in enhancement.

## 8. Suggested build order

1. `lib/ffmpeg.ts` + `use-ffmpeg.ts` + `ffmpeg-gate` + `MediaResult` (the engine
   plumbing and shared UI), proven with **one** tool (MP3 → WAV is simplest).
2. Remaining audio tools (WAV→MP3, FLAC→MP3).
3. Video frame extract + trim.
4. MP4 ↔ GIF (palette work is the fiddliest).
5. Manual browser verification pass + README header/deploy notes.
</content>
