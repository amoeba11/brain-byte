# Brain Byte

Playful, meme-y short-form animated explainers about science & tech, for YouTube
Shorts. Built with [Remotion](https://www.remotion.dev)
(code-based video — React/TypeScript renders to MP4).

## Project at a glance
- **Format:** <60s vertical videos (1080x1920)
- **Voiceover:** AI TTS (e.g. ElevenLabs)
- **Cadence:** 2x/week (adjustable)
- See `docs/style-guide.md` and `docs/growth-strategy.md` for tone, visual rules, and format pillars.

## Structure
```
src/
  compositions/   # reusable video templates (e.g. Explainer)
  components/     # shared visual components (charts, text reveals, icons)
  themes/         # brand colors, fonts
episodes/
  NNN-topic-slug/ # one folder per episode: script.md, data.ts, notes.md
assets/
  audio/          # voiceover + music/sfx
  fonts/
  images/
docs/
  content-pipeline.md  # idea -> script -> render -> publish workflow
  style-guide.md       # tone, visual rules, recurring formats
  growth-strategy.md   # cadence, metrics, idea backlog
```

## Getting started
```bash
npm install
npm run dev        # opens Remotion Studio to preview/edit compositions
```

## Making a new episode
1. Copy `episodes/001-example-topic/` → `episodes/NNN-topic-slug/`.
2. Follow `docs/content-pipeline.md` end to end (script → TTS → composition → render → publish).

## Render a video
```bash
npx remotion render Explainer out/<episode-slug>.mp4
```
