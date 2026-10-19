import { readFileSync, existsSync } from "fs";
import { google } from "googleapis";

const CREDENTIALS_PATH = "youtube-credentials.json";
const TOKEN_PATH = "youtube-token.json";
const REDIRECT_URI = "http://localhost:8787/oauth2callback";

type InstalledCredentials = {
  installed?: { client_id: string; client_secret: string };
  web?: { client_id: string; client_secret: string };
};

function loadClientSecret() {
  if (!existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `Missing ${CREDENTIALS_PATH}. Download it from Google Cloud Console ` +
        `(OAuth client, Desktop app type) and place it at the project root. ` +
        `See README.md for setup steps. This file must never be committed.`,
    );
  }
  const raw: InstalledCredentials = JSON.parse(
    readFileSync(CREDENTIALS_PATH, "utf-8"),
  );
  const creds = raw.installed ?? raw.web;
  if (!creds) {
    throw new Error(`${CREDENTIALS_PATH} doesn't look like an OAuth client secret file.`);
  }
  return creds;
}

export function getOAuthClient() {
  const { client_id, client_secret } = loadClientSecret();
  return new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);
}

export function loadSavedToken() {
  if (!existsSync(TOKEN_PATH)) {
    throw new Error(
      `No ${TOKEN_PATH} found — run "npm run youtube:auth" once first.`,
    );
  }
  return JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
}

export { CREDENTIALS_PATH, TOKEN_PATH, REDIRECT_URI };
