// Usage: npm run youtube:set-privacy -- --id <videoId> --privacy public|unlisted|private
import { google } from "googleapis";
import { getOAuthClient, loadSavedToken } from "./client";

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.id || !args.privacy) {
    console.error("Required: --id <videoId> --privacy private|unlisted|public");
    process.exit(1);
  }
  if (!["private", "unlisted", "public"].includes(args.privacy)) {
    console.error(`--privacy must be private, unlisted, or public (got "${args.privacy}")`);
    process.exit(1);
  }

  const client = getOAuthClient();
  client.setCredentials(loadSavedToken());
  const youtube = google.youtube({ version: "v3", auth: client });

  await youtube.videos.update({
    part: ["status"],
    requestBody: {
      id: args.id,
      status: { privacyStatus: args.privacy },
    },
  });

  console.log(`Set https://youtube.com/watch?v=${args.id} to ${args.privacy}.`);
}

main().catch((err) => {
  console.error(err?.response?.data ?? err);
  process.exit(1);
});
