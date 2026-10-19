// Usage:
//   npm run youtube:upload -- --file out/001-mirror-flip.mp4 \
//     --title "Why Mirrors Flip Left-Right" \
//     --description "..." \
//     --tags shorts,science,physics \
//     --privacy private
//
// `privacy` defaults to "private" so nothing goes public without you
// explicitly promoting it in YouTube Studio (or passing --privacy public).
import { createReadStream, existsSync } from "fs";
import { google } from "googleapis";
import { getOAuthClient, loadSavedToken } from "./client";

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[key] = value;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.file || !args.title) {
    console.error(
      "Required: --file <path to .mp4> --title \"...\"\n" +
        "Optional: --description \"...\" --tags a,b,c --privacy private|unlisted|public --category <id>",
    );
    process.exit(1);
  }

  if (!existsSync(args.file)) {
    console.error(`File not found: ${args.file}`);
    process.exit(1);
  }

  const privacyStatus = args.privacy ?? "private";
  if (!["private", "unlisted", "public"].includes(privacyStatus)) {
    console.error(`--privacy must be private, unlisted, or public (got "${privacyStatus}")`);
    process.exit(1);
  }

  const client = getOAuthClient();
  client.setCredentials(loadSavedToken());

  const youtube = google.youtube({ version: "v3", auth: client });

  console.log(`Uploading "${args.title}" as ${privacyStatus}...`);

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: args.title,
        description: args.description ?? "",
        tags: args.tags ? args.tags.split(",").map((t) => t.trim()) : undefined,
        categoryId: args.category ?? "28", // Science & Technology
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: createReadStream(args.file),
    },
  });

  console.log(`\nUploaded: https://youtube.com/watch?v=${res.data.id}`);
  console.log(`Status: ${privacyStatus} — review/promote it in YouTube Studio.`);
}

main().catch((err) => {
  console.error(err?.response?.data ?? err);
  process.exit(1);
});
