# Brain Byte

Playful, meme-y short-form animated explainers about science & tech, for YouTube
Shorts. Built with [Remotion](https://www.remotion.dev)
(code-based video — React/TypeScript renders to MP4).

## Product Thesis
Short-form content is a high-frequency feedback environment. Small changes in
pacing, hook structure, visuals, captions, and audio can meaningfully affect
viewer retention.

This project tests whether those variables can be controlled and improved
systematically through automation.

Working assumptions:
- Production can be mostly automated.
- Retention cannot be solved by automation alone.
- The highest-leverage work is building a feedback loop that translates
  platform behavior into product changes.
- Human taste may still be the limiting factor — especially in subject
  selection, emotional resonance, and narrative quality.

## What This Is
A solo experiment: can one person run a multi-channel short-form content
operation where the marginal cost of producing and publishing each
additional video approaches zero?

The first-order challenge is automation.
The second-order challenge is quality.
The third-order challenge is learning fast enough from viewer behavior to
improve the system.

## Stats dashboard
📊 [Public stats dashboard](https://amoeba11.github.io/brain-byte/) — per-project
tiles (total views, video count, views per episode), updated daily. Shows
only aggregate numbers — no channel names, handles, video titles, or links
back to the real channel.

A GitHub Action (`.github/workflows/update-stats.yml`) runs
`npm run youtube:fetch-stats` daily, refreshes `docs/stats.json`, and commits
it back to `main`; GitHub Pages serves `docs/index.html` from there. See
`docs/dashboard.md` for setup (API key, channel ID, adding another project).

## Project at a glance
- **Format:** <60s vertical videos (1080x1920)
- **Voiceover:** AI TTS (e.g. ElevenLabs)
- **Cadence:** daily, 1 video/day
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

## YouTube upload

One-time setup:
1. In [Google Cloud Console](https://console.cloud.google.com), create (or pick) a project.
2. Enable the **YouTube Data API v3** (APIs & Services → Library).
3. Configure the **OAuth consent screen** (External, Testing mode is fine — add your own Google account as a test user).
4. Create an **OAuth client ID** (APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type: **Desktop app**).
5. Download the JSON and save it at the project root as `youtube-credentials.json` (gitignored — never commit it).
6. Run `npm run youtube:auth` — it prints a URL; open it in your own browser, sign in, approve. This saves `youtube-token.json` (also gitignored).

Then, to upload an episode:
```bash
npm run youtube:upload -- --file out/001-mirror-flip.mp4 \
  --title "Why Mirrors Flip Left-Right" \
  --description "..." \
  --tags shorts,science,physics \
  --privacy private
```
Uploads default to **private** so you can review/promote in YouTube Studio
rather than going straight to public.
