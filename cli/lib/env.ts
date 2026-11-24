import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { CliError } from "../providers/wavespeed/types";

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  const root = process.cwd();
  // Prefer .env.local over .env (local overrides)
  const envPath = path.join(root, ".env");
  const localPath = path.join(root, ".env.local");
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath, quiet: true });
  if (fs.existsSync(localPath))
    dotenv.config({ path: localPath, quiet: true, override: true });
  loaded = true;
}

export function getApiKeyFromEnv(): string {
  loadEnv();
  const key = process.env.WAVESPEED_API_KEY?.trim();
  if (!key) {
    throw new CliError(
      "ERR-ENV-MISSING",
      "WAVESPEED_API_KEY not set. Copy .env.example → .env or .env.local",
    );
  }
  return key;
}
