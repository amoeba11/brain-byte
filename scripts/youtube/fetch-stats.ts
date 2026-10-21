// Fetches public channel/video stats for the "Project Brain Byte" dashboard
// and writes an anonymized snapshot to docs/stats.json (GitHub Pages serves
// this repo from the /docs folder).
//
// Unlike upload.ts/auth.ts, this uses a plain API key (no OAuth) since it
// only reads public data. Required env vars:
//   YOUTUBE_API_KEY      — API key with YouTube Data API v3 enabled
//   YOUTUBE_CHANNEL_ID   — the channel's UC... id (never committed)
//
// Output never includes the channel name/handle, video titles, thumbnails,
// or video ids — only numbers, so the file is safe to publish.
import { writeFileSync, mkdirSync } from "fs";
import { google } from "googleapis";

const OUTPUT_PATH = "docs/stats.json";

// One entry per tracked channel. Today only Brain Byte is populated; a
// second project can be added here without changing the script or site.
const PROJECTS = [
  {
    slug: "project-brain-byte",
    label: "Project Brain Byte",
    description:
      "Everyday science and tech, explained in under a minute — an anonymous short-form channel tracked here for an open metrics experiment.",
    channelIdEnvVar: "YOUTUBE_CHANNEL_ID",
  },
];

async function fetchProjectStats(
  youtube: ReturnType<typeof google.youtube>,
  channelId: string,
) {
  const channelRes = await youtube.channels.list({
    id: [channelId],
    part: ["statistics", "contentDetails"],
  });
  const channel = channelRes.data.items?.[0];
  if (!channel) {
    throw new Error(`No channel found for id ${channelId}`);
  }

  const totalViews = Number(channel.statistics?.viewCount ?? 0);
  const videoCount = Number(channel.statistics?.videoCount ?? 0);
  const uploadsPlaylistId =
    channel.contentDetails?.relatedPlaylists?.uploads;

  const videoIds: string[] = [];
  let pageToken: string | undefined;
  if (uploadsPlaylistId) {
    do {
      const playlistRes = await youtube.playlistItems.list({
        playlistId: uploadsPlaylistId,
        part: ["contentDetails"],
        maxResults: 50,
        pageToken,
      });
      for (const item of playlistRes.data.items ?? []) {
        const id = item.contentDetails?.videoId;
        if (id) videoIds.push(id);
      }
      pageToken = playlistRes.data.nextPageToken ?? undefined;
    } while (pageToken);
  }

  // Uploads playlist returns newest-first; reverse so episode numbers
  // increase in upload order (oldest = Episode 1).
  videoIds.reverse();

  const videos: { episode: number; views: number; likes: number }[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videosRes = await youtube.videos.list({
      id: batch,
      part: ["statistics"],
    });
    const items = videosRes.data.items ?? [];
    for (let j = 0; j < items.length; j++) {
      videos.push({
        episode: i + j + 1,
        views: Number(items[j].statistics?.viewCount ?? 0),
        likes: Number(items[j].statistics?.likeCount ?? 0),
      });
    }
  }

  return { totalViews, videoCount, videos };
}

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("Missing YOUTUBE_API_KEY env var.");
    process.exit(1);
  }

  const youtube = google.youtube({ version: "v3", auth: apiKey });

  const projects = [];
  for (const project of PROJECTS) {
    const channelId = process.env[project.channelIdEnvVar];
    if (!channelId) {
      console.error(`Missing ${project.channelIdEnvVar} env var.`);
      process.exit(1);
    }
    const stats = await fetchProjectStats(youtube, channelId);
    projects.push({
      slug: project.slug,
      label: project.label,
      description: project.description,
      ...stats,
    });
  }

  const output = {
    updatedAt: new Date().toISOString(),
    projects,
  };

  mkdirSync("docs", { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
