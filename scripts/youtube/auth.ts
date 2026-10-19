// One-time setup: run `npm run youtube:auth`, open the printed URL in YOUR
// own browser, sign in and approve, and this captures the token locally.
import { createServer } from "http";
import { writeFileSync } from "fs";
import { getOAuthClient, TOKEN_PATH, REDIRECT_URI } from "./client";

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

async function main() {
  const client = getOAuthClient();
  const port = Number(new URL(REDIRECT_URI).port);

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("\nOpen this URL in your browser and approve access:\n");
  console.log(authUrl);
  console.log(
    `\nWaiting for you to approve in your browser (listening on localhost:${port})...`,
  );

  const code: string = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (!req.url) return;
      const url = new URL(req.url, REDIRECT_URI);
      const c = url.searchParams.get("code");
      const err = url.searchParams.get("error");
      if (err) {
        res.end("Authorization failed — check your terminal.");
        server.close();
        reject(new Error(err));
        return;
      }
      if (c) {
        res.end("Authorized! You can close this tab and return to your terminal.");
        server.close();
        resolve(c);
      }
    });
    server.listen(port);
  });

  const { tokens } = await client.getToken(code);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log(`\nSaved credentials to ${TOKEN_PATH}. You're ready to upload.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
