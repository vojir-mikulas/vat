# Phase 8 — Audio Editor & audio tools

> Plan only — not yet implemented. Builds on the Phase 7 ffmpeg.wasm engine
> (`lib/ffmpeg.ts`, `use-ffmpeg.ts`, `lib/video-media.ts` waveform, the
> `VideoTimeline` region UI, `MediaResult`/`FfmpegStatus`). Nothing new about the
> engine — this phase is pure audio UX + ffmpeg filter recipes.

## 1. Motivation

Audio today is one tool: `audio-convert` (format/bitrate transcode). The ask is
"more audio tools, something like Audacity." A full multitrack DAW (layer mixing,
recording) is out of scope for a privacy-first single-file utility app. But the
common-use ~80% of Audacity — load a clip, see the waveform, select a region, trim
and apply effects, export — is very achievable and reuses what Phase 7 already
built.

## 2. Centerpiece: the Audio Editor tool (`audio-editor`)

Mirror `tools/video-editor/` structure: an `<audio>` player on top, a zoomable
waveform timeline below with a draggable playhead and in/out trim handles, then an
effects rack. Reuse:

- `useWaveform(file)` (already extracts Web Audio peaks) for the timeline display.
- `VideoTimeline` — either reused directly (it already renders a waveform lane and
  in/out handles) or forked to a leaner `AudioTimeline` if the filmstrip/thumb
  machinery gets in the way. **Decide during build**; prefer reuse.
- `useFfmpegJob` for run/progress, `MediaResult` + `FfmpegStatus` for output.

### Operations (all in the default `@ffmpeg/core`)

| Op | ffmpeg filter / args | Notes |
|---|---|---|
| Trim / cut to selection | `-ss <in> -to <out>` | Re-encode (no `-c copy`) so cuts are sample-accurate, not keyframe-snapped like video. |
| Normalize (loudness) | `loudnorm` (EBU R128) or `dynaudnorm` | `loudnorm` is the safe default. |
| Gain (volume ±dB) | `volume=<n>dB` | |
| Fade in / out | `afade=t=in:...`, `afade=t=out:...` | Durations from UI. |
| Speed (tempo) | `atempo=<r>` | Valid 0.5–2.0; **chain** factors for beyond (e.g. 4× = `atempo=2,atempo=2`). |
| Reverse | `areverse` | |
| Trim silence | `silenceremove` | Leading/trailing; expose threshold + min-duration. |
| Mono ↔ stereo | `-ac 1` / `pan` | |

Effects compose into one `-af` filter chain where possible, so a single export pass
applies everything. Output format follows the input (or offer a target picker
reusing `AUDIO_TARGETS`).

## 3. Standalone quick wins (optional, cheap)

Each = Dropzone + options + one arg-builder, exactly like `audio-convert`:

- **Waveform / spectrogram image** (`audio-waveform`?) — `showwavespic` /
  `showspectrumpic` → PNG. Shareable static output, no editor needed.
- **Audio merge / join** (`audio-merge`?) — concat multiple clips into one.
- **Normalize** standalone — one-click `loudnorm` if the full editor feels heavy
  for that single task.

## 4. Build order

1. **Arg builders + unit tests** in `lib/ffmpeg-args.ts` (`audioEditArgs` / per-op
   builders). Per Phase 7's testing strategy: the filters can't run headlessly, but
   the arg-list construction (filter-chain assembly, `atempo` chaining, dB
   formatting, time math) is pure and **must** be unit-tested with exact-array
   assertions.
2. **Audio Editor tool** — `tools/audio-editor/audio-editor-tool.tsx`, registry
   entry (`category: 'audio'`), i18n strings under `tools.json`. Reuse waveform +
   timeline; wire the effects rack to the builders.
3. **Manual browser verification** — load engine, apply each op on a small sample,
   confirm playable output + download.
4. Standalone tools (§3) as follow-ups, prioritized waveform-image then merge.

## 5. Risks / open questions

- **Sample-accurate cuts** require re-encode → slower than video's stream-copy
  trim; set UI expectations.
- **Encoder availability** — confirm the default core bundles the encoders for the
  chosen output formats (already a Phase 7 open question; verify before shipping
  lossy targets).
- **`VideoTimeline` reuse vs fork** — resolve early; don't let video-specific props
  bleed into the audio path.
- **Pitch shift** intentionally omitted — `rubberband` likely isn't in the default
  core, and `asetrate`-based pitch couples pitch to speed. Revisit only if a build
  with `rubberband` is adopted.
