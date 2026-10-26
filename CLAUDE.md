# CLAUDE.md

Instructions for Claude (and Claude Code) when working in this repo.

## What this project is
Brain Byte is a Remotion (React/TypeScript) project that generates short-form
(<60s, 1080x1920) animated science/tech explainer videos for YouTube Shorts.
See [README.md](README.md) for the full project overview, structure, and
episode/upload workflow.

## Commands
```bash
npm install
npm run dev      # Remotion Studio, for previewing/editing compositions
npm run lint     # eslint + tsc
npm run build    # remotion bundle
npx remotion render Explainer out/<episode-slug>.mp4   # render a video
```
Run `npm run lint` before committing any code change.

## Working in this repo
- `src/compositions/` — reusable video templates
- `src/components/` — shared visual components
- `src/themes/` — brand colors/fonts
- `episodes/NNN-topic-slug/` — one folder per episode (script, data, notes)
- `docs/content-pipeline.md`, `docs/style-guide.md`, `docs/growth-strategy.md` — follow these for tone, visual rules, and the idea → script → render → publish workflow
- Rendered output in `out/` is a build artifact, not something to hand-edit

## Episode numbering
- Episode folders are `episodes/NNN-topic-slug/`, `NNN` zero-padded to 3 digits
- Use the next unused number after the highest existing episode folder — check `episodes/` first, don't guess or reuse a number
- `topic-slug` is a short kebab-case description of the episode's topic

## Style guide
- Re-read `docs/style-guide.md` before writing or editing any episode script, not just once at the start of a session — tone and visual rules there take precedence over generic conventions

## Voiceover
- Generate episode voiceover with macOS's built-in `say` command, not an external TTS service
- Write the narration text from the episode script, then render to audio, e.g.:
  ```bash
  say -v <voice> -r <wpm> -o episodes/NNN-topic-slug/voiceover.aiff -f episodes/NNN-topic-slug/narration.txt
  ```
  (`say -v '?'` lists available voices; convert with `afconvert -f mp4f -d aac in.aiff out.m4a` if a compressed format is needed)
- Keep the voiceover under the 60s Shorts limit and keep the voice/rate consistent across episodes; follow the tone rules in `docs/style-guide.md`
- Store the audio and narration text in the episode's folder

## Publishing a video
Follow these steps in order (details in `docs/content-pipeline.md`):
1. **Script** — copy `episodes/001-example-topic/` to the next unused `episodes/NNN-topic-slug/` and fill in `script.md` (re-read `docs/style-guide.md` first)
2. **Voiceover** — generate with `say` (see Voiceover above); keep total length under 60s
3. **Composition** — fill `episodes/NNN-topic-slug/data.ts`, reuse an existing composition in `src/compositions/` where possible, and sync timing to the voiceover. Every video must include the channel watermark (`<ChannelWatermark />` from `src/components/ChannelWatermark.tsx`, as in `MirrorFlip.tsx`)
4. **Verify** — preview in Remotion Studio or render a short frame range, confirming the watermark is visible; run `npm run lint`
5. **Render** — `npx remotion render Explainer out/<episode-slug>.mp4 --props='./episodes/NNN-topic-slug/data.json'`
6. **Captions** — burn in captions (videos are often watched muted)
7. **PR** — commit the episode/code changes on a branch and open a PR (see Git workflow); `out/` is not committed
8. **Upload** — only after the user confirms the video is ready:
   ```bash
   npm run youtube:upload -- --file out/<episode-slug>.mp4 --title "..." --description "..." --tags shorts,science --privacy private
   ```
   Always upload as `private`; never set a video public yourself — the user reviews it in YouTube Studio and promotes it
9. **Track** — note performance in `docs/growth-strategy.md`

## Testing/verification
- After changing a composition or component, preview it in Remotion Studio (`npm run dev`) or render at least a short frame range before calling the change done — don't rely on `npm run lint` passing alone as proof it looks right
- Run `npm run lint` before every commit

## Secrets handling
- `youtube-credentials.json` and `youtube-token.json` are gitignored secrets — never commit them, and never print or quote their contents in chat or logs even if asked

## Git workflow: always use a PR
Always create a PR for changes — code, episodes, and docs (including edits to this file) alike. Never commit directly to `main`. For every change:
1. Create a new branch off `main` (e.g. `feature/<slug>`, `fix/<slug>`, `docs/<slug>`)
2. Commit your changes there
3. Push the branch and open a pull request into `main`
4. Merge the PR once it's ready (don't leave changes stacked on an unmerged branch)

Do not push directly to `main` or force-push over it.
