# Content Pipeline

```
idea → script → voiceover (TTS) → Remotion composition → render → captions → export → publish
```

## 1. Idea
Capture in a running backlog (see `docs/growth-strategy.md` for format pillars). One idea = one potential episode.

## 2. Script
Copy `episodes/001-example-topic/` as a template → rename to `NNN-topic-slug/`.
Fill out `script.md`: hook, beats, full VO text, visual notes, sources.

## 3. Voiceover (AI TTS)
- Paste the VO script into your TTS tool of choice (e.g. ElevenLabs, OpenAI TTS).
- Export audio, drop it into `assets/audio/<episode-slug>.mp3`.

## 4. Composition
- Fill `episodes/NNN-topic-slug/data.ts` with episode-specific props (title, stats, etc.).
- Reuse templates in `src/compositions/` where possible; only build a new composition
  type when an existing one genuinely doesn't fit.
- Sync animation timing to the voiceover track (use the audio waveform in the
  Remotion preview as a guide).

## 5. Render
```bash
npx remotion render Explainer out/<episode-slug>.mp4 --props='./episodes/NNN-topic-slug/data.json'
```
(Or render via the Remotion Studio UI: `npm run dev`.)

## 6. Captions
Short-form content is often watched muted — burn in captions before publishing
(Remotion's `@remotion/captions` package, or an external auto-caption tool).

## 7. Publish
Upload via the YouTube upload script (see README.md's "YouTube upload" section
for one-time setup):
```bash
npm run youtube:upload -- --file out/<episode-slug>.mp4 \
  --title "..." \
  --description "..." \
  --tags shorts,science \
  --privacy private
```
It uploads as **private** by default — review it in YouTube Studio and
promote to public when you're ready, rather than auto-publishing. Track
performance in `docs/growth-strategy.md`.
