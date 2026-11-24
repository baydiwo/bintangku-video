import type { CharacterAlignment, TtsTimingResult } from "./types";
import { CliError } from "./types";

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;

const pickString = (...vals: unknown[]): string | null => {
  for (const v of vals) {
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
};

const normalizeAlignment = (raw: unknown): CharacterAlignment | null => {
  const obj = asRecord(raw);
  if (!obj) return null;

  const characters = obj.characters;
  const starts =
    obj.character_start_times_seconds ??
    obj.characterStartTimesSeconds ??
    obj.character_start_times;
  const ends =
    obj.character_end_times_seconds ??
    obj.characterEndTimesSeconds ??
    obj.character_end_times;

  if (
    !Array.isArray(characters) ||
    !Array.isArray(ends) ||
    characters.length === 0 ||
    ends.length === 0
  ) {
    return null;
  }

  const startArr = Array.isArray(starts)
    ? starts.map(Number)
    : characters.map((_, i) => (i === 0 ? 0 : Number(ends[i - 1]) || 0));

  return {
    characters: characters.map(String),
    characterStartTimesSeconds: startArr,
    characterEndTimesSeconds: ends.map(Number),
  };
};

/**
 * Eleven v3 Timing via WaveSpeed may return:
 * - `{ audio, alignment }`
 * - `[{ audio, alignment }]`
 * - `[audioUrl, alignmentObj]` (defensive)
 */
export function parseTtsTimingOutputs(outputs: unknown): TtsTimingResult {
  const candidates: unknown[] = Array.isArray(outputs)
    ? outputs
    : outputs == null
      ? []
      : [outputs];

  let audioUrl: string | null = null;
  let alignment: CharacterAlignment | null = null;

  for (const item of candidates) {
    if (typeof item === "string" && /\.mp3(\?|$)/i.test(item)) {
      audioUrl ??= item;
      continue;
    }
    const rec = asRecord(item);
    if (!rec) continue;

    audioUrl ??= pickString(
      rec.audio,
      rec.audio_url,
      rec.url,
      Array.isArray(rec.outputs) ? rec.outputs[0] : null,
    );

    alignment ??=
      normalizeAlignment(rec.alignment) ??
      normalizeAlignment(rec.normalized_alignment) ??
      normalizeAlignment(rec);
  }

  // Sometimes outputs is a single URL string in an array, and alignment elsewhere —
  // already handled above. If still no audio, scan nested.
  if (!audioUrl) {
    const flat = JSON.stringify(outputs);
    const match = flat.match(/https?:\/\/[^"\\]+\.mp3[^"\\]*/i);
    if (match) audioUrl = match[0];
  }

  if (!audioUrl) {
    throw new CliError(
      "ERR-WS-FAILED",
      "TTS outputs missing audio URL. Inspect prediction outputs (TASK-VAL-006).",
    );
  }

  return { audioUrl, alignment, rawOutputs: outputs };
}
