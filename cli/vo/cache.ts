import { sha256Text, canonicalJson } from "../lib/hash";
import type { VoiceConfig } from "../lib/config";

export function makeCacheKey(
  speechText: string,
  voice: VoiceConfig,
): string {
  return sha256Text(
    [
      speechText,
      voice.provider,
      voice.model,
      voice.voice_id ?? "",
      canonicalJson(voice.settings ?? {}),
    ].join("|"),
  );
}
