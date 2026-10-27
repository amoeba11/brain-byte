# Content Pipeline

```
idea → topic approval → script → voiceover (TTS) → Remotion composition → render → captions → export → publish
```

## 1. Idea
Capture in a running backlog (see `docs/growth-strategy.md` for format pillars). One idea = one potential episode.

## 2. Topic approval
Gate before any episode work. Claude proposes the topic (title, hook, pillar fit,
visual approach) and waits for the user's explicit yes. No folder, script, or
composition is created until then. See `CLAUDE.md` → "Topic approval".

## 3. Script
Copy `episodes/001-example-topic/` as a template → rename to `NNN-topic-slug/`.
Fill out `script.md`: hook, beats, full VO text, visual notes, sources.

## 4. Voiceover (macOS `say`)
- Generate the VO with macOS's `say` command, e.g.
  `say -v <voice> -o assets/audio/<episode-slug>.aiff -f episodes/NNN-topic-slug/narration.txt`
- Convert if needed (`afconvert -f mp4f -d aac in.aiff out.m4a`) and keep the audio in `assets/audio/`.

## 5. Composition
- Fill `episodes/NNN-topic-slug/data.ts` with episode-specific props (title, stats, etc.).
- Reuse templates in `src/compositions/` where possible; only build a new composition
  type when an existing one genuinely doesn't fit.
- Sync animation timing to the voiceover track (use the audio waveform in the
  Remotion preview as a guide).

## 6. Render
```bash
npx remotion render Explainer out/<episode-slug>.mp4 --props='./episodes/NNN-topic-slug/data.json'
```
(Or render via the Remotion Studio UI: `npm run dev`.)

## 7. Captions
Short-form content is often watched muted — burn in captions before publishing
(Remotion's `@remotion/captions` package, or an external auto-caption tool).

## 8. Publish
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
