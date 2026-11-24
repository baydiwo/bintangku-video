import { getApiKeyFromEnv } from "../../lib/env";
import {
  downloadToFile,
  getBalance,
  pollUntilDone,
  runPrediction,
  submit,
} from "./client";
import { parseTtsTimingOutputs } from "./parse-outputs";
import type { CharacterAlignment, TtsTimingResult } from "./types";
import { CliError } from "./types";

export { CliError };
export type { CharacterAlignment, TtsTimingResult };
export {
  downloadToFile,
  getBalance,
  pollUntilDone,
  runPrediction,
  submit,
  parseTtsTimingOutputs,
};

export function getApiKey(): string {
  return getApiKeyFromEnv();
}

export async function generateTtsWithTiming(opts: {
  model: string;
  text: string;
  voiceId: string;
  stability?: number;
  onStatus?: (status: string) => void;
}): Promise<{ predictionId: string; result: TtsTimingResult }> {
  if (opts.text.length < 1 || opts.text.length > 5000) {
    throw new CliError(
      "ERR-SCHEMA",
      `TTS text must be 1–5000 characters (got ${opts.text.length})`,
    );
  }

  const body: Record<string, unknown> = {
    text: opts.text,
    voice_id: opts.voiceId,
  };
  if (typeof opts.stability === "number") {
    body.stability = opts.stability;
  }

  const done = await runPrediction(
    getApiKey(),
    opts.model,
    body,
    { onStatus: opts.onStatus },
  );

  return {
    predictionId: done.predictionId,
    result: parseTtsTimingOutputs(done.outputs),
  };
}

export async function generateStoryDraft(opts: {
  model: string;
  prompt: string;
  onStatus?: (status: string) => void;
}): Promise<{ predictionId: string; text: string }> {
  const done = await runPrediction(
    getApiKey(),
    opts.model,
    {
      prompt: opts.prompt,
      audience: "children",
      format: "script",
      length: "short",
    },
    { onStatus: opts.onStatus },
  );

  const text = extractTextOutput(done.outputs);
  if (!text) {
    throw new CliError(
      "ERR-WS-FAILED",
      "Story generator returned empty text output",
    );
  }
  return { predictionId: done.predictionId, text };
}

function extractTextOutput(outputs: unknown): string | null {
  if (typeof outputs === "string") return outputs;
  if (Array.isArray(outputs)) {
    for (const item of outputs) {
      if (typeof item === "string" && item.trim()) return item;
      if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        if (typeof rec.text === "string") return rec.text;
        if (typeof rec.story === "string") return rec.story;
        if (typeof rec.content === "string") return rec.content;
      }
    }
  }
  if (outputs && typeof outputs === "object") {
    const rec = outputs as Record<string, unknown>;
    if (typeof rec.text === "string") return rec.text;
  }
  return null;
}
