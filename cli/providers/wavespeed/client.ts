import * as fs from "fs";
import * as path from "path";
import { CliError } from "./types";
import type {
  WavespeedPollResult,
  WavespeedPredictionStatus,
  WavespeedSubmitResult,
} from "./types";

const BASE = "https://api.wavespeed.ai/api/v3";
const SUBMIT_TIMEOUT_MS = 60_000;
const POLL_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;
const MAX_TRANSIENT_ERRORS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const authHeader = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
});

const readRetryAfterMs = (res: Response, fallback: number): number => {
  const raw = res.headers.get("retry-after");
  if (!raw) return fallback;
  const sec = Number(raw);
  if (!Number.isNaN(sec)) return Math.max(fallback, sec * 1000);
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) return Math.max(fallback, date - Date.now());
  return fallback;
};

const unwrapData = (body: unknown): Record<string, unknown> => {
  if (body !== null && typeof body === "object") {
    const rec = body as Record<string, unknown>;
    if (rec.data !== null && typeof rec.data === "object") {
      return rec.data as Record<string, unknown>;
    }
    return rec;
  }
  return {};
};

/**
 * Submit once. Never auto-retry (WaveSpeed: retry can double-bill).
 */
export async function submit(
  apiKey: string,
  modelId: string,
  body: Record<string, unknown>,
): Promise<WavespeedSubmitResult> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/${modelId}`, {
      method: "POST",
      headers: authHeader(apiKey),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
    });
  } catch (err) {
    throw new CliError(
      "ERR-WS-SUBMIT",
      `Submit failed before response (do not resubmit blindly — check predictions list). ${String(err)}`,
    );
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new CliError(
      "ERR-WS-SUBMIT",
      `Submit HTTP ${res.status} with non-JSON body. Check predictions list before retrying.`,
    );
  }

  const data = unwrapData(json);
  const predictionId =
    typeof data.id === "string"
      ? data.id
      : typeof (json as { data?: { id?: string } })?.data?.id === "string"
        ? (json as { data: { id: string } }).data.id
        : null;

  if (!res.ok || !predictionId) {
    const msg =
      (json as { message?: string })?.message ||
      (typeof data.error === "string" ? data.error : null) ||
      `HTTP ${res.status}`;
    throw new CliError(
      "ERR-WS-SUBMIT",
      `${msg}. If unsure whether the task was created, check WaveSpeed predictions before submitting again.`,
    );
  }

  return { predictionId, raw: json };
}

/**
 * Poll until terminal status. Retry only transient poll errors (429/5xx).
 */
export async function pollUntilDone(
  apiKey: string,
  predictionId: string,
  opts?: { onStatus?: (status: string) => void },
): Promise<WavespeedPollResult> {
  let transientErrors = 0;

  while (true) {
    let res: Response;
    try {
      res = await fetch(`${BASE}/predictions/${predictionId}/result`, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
      });
    } catch (err) {
      transientErrors += 1;
      if (transientErrors >= MAX_TRANSIENT_ERRORS) {
        throw new CliError(
          "ERR-WS-POLL",
          `Polling failed ${MAX_TRANSIENT_ERRORS} times for ${predictionId}: ${String(err)}`,
        );
      }
      await sleep(10_000);
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      transientErrors += 1;
      if (transientErrors >= MAX_TRANSIENT_ERRORS) {
        throw new CliError(
          "ERR-WS-POLL",
          `HTTP ${res.status} while polling ${predictionId} (${MAX_TRANSIENT_ERRORS} transient errors)`,
        );
      }
      await sleep(readRetryAfterMs(res, 10_000));
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new CliError(
        "ERR-WS-POLL",
        `HTTP ${res.status} for ${predictionId}: ${text.slice(0, 400)}`,
      );
    }

    transientErrors = 0;
    const json = await res.json();
    const data = unwrapData(json);
    const status = String(data.status ?? "") as WavespeedPredictionStatus;
    opts?.onStatus?.(status);

    if (status === "completed") {
      return {
        predictionId,
        status,
        outputs: data.outputs,
        raw: json,
      };
    }

    if (
      status === "failed" ||
      status === "cancelled" ||
      status === "timeout" ||
      status === "deleted"
    ) {
      const errMsg =
        typeof data.error === "string" && data.error
          ? data.error
          : (json as { message?: string })?.message || status;
      throw new CliError(
        "ERR-WS-FAILED",
        `Prediction ${predictionId} ended with ${status}: ${errMsg}`,
      );
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

export async function downloadToFile(
  url: string,
  destPath: string,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  } catch (err) {
    throw new CliError(
      "ERR-WS-EXPIRED",
      `Failed to download output (URL may have expired ≤7 days): ${String(err)}`,
    );
  }

  if (!res.ok) {
    throw new CliError(
      "ERR-WS-EXPIRED",
      `Download HTTP ${res.status} for ${url}`,
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const tmp = `${destPath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, destPath);
}

export async function getBalance(apiKey: string): Promise<number> {
  const res = await fetch(`${BASE}/balance`, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
  });

  const json = (await res.json()) as {
    code?: number;
    message?: string;
    data?: { balance?: number };
  };

  if (!res.ok || json.code !== 200 || typeof json.data?.balance !== "number") {
    throw new CliError(
      "ERR-WS-POLL",
      json.message || `Balance check failed (HTTP ${res.status})`,
    );
  }

  return json.data.balance;
}

export async function runPrediction(
  apiKey: string,
  modelId: string,
  body: Record<string, unknown>,
  opts?: { onStatus?: (status: string) => void },
): Promise<WavespeedPollResult> {
  const { predictionId } = await submit(apiKey, modelId, body);
  return pollUntilDone(apiKey, predictionId, opts);
}
