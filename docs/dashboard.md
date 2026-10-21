# Public stats dashboard

`docs/index.html` is a static page, published via GitHub Pages from the
`main` branch's `/docs` folder, that reads `docs/stats.json` and renders
aggregate stats (total views, video count, views per episode) per tracked
project. It never shows channel names, handles, video titles, or links back
to the real channel — only numbers, labeled by project (e.g. "Project Brain
Byte").

## How it updates

`.github/workflows/update-stats.yml` runs `npm run youtube:fetch-stats`
daily (and on manual trigger) using two repo secrets:

- `YOUTUBE_API_KEY` — a YouTube Data API v3 key (Google Cloud Console →
  Credentials → Create API key; restrict it to the YouTube Data API v3)
- `YOUTUBE_CHANNEL_ID` — the channel's `UC...` id

Add both under **Settings → Secrets and variables → Actions → New
repository secret**. The workflow then commits the refreshed
`docs/stats.json` back to `main`.

## Adding another project later

`scripts/youtube/fetch-stats.ts` loops over a `PROJECTS` array (slug,
label, channel-id env var). Add an entry there and a matching secret, and
it appears automatically as its own section on the dashboard — no changes
needed to `docs/index.html`.

## Enabling GitHub Pages (one-time)

Settings → Pages → Build and deployment → Source: **Deploy from a
branch** → Branch: `main`, folder: `/docs` → Save. The site publishes at
`https://amoeba11.github.io/brain-byte/`.
