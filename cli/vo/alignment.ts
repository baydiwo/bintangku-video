import type { CharacterAlignment } from "../providers/wavespeed/types";
import type { CaptionWord } from "../lib/video-types";

/** Convert character alignment → word captions. Caption text from script words. */
export function alignmentToCaptions(
  scriptText: string,
  alignment: CharacterAlignment | null,
  offsetMs: number,
): { captions: CaptionWord[]; source: "tts" | "proportional" } {
  const words = scriptText.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { captions: [], source: "proportional" };

  if (!alignment) {
    return {
      captions: proportionalCaptions(words, estimateDuration(scriptText), offsetMs),
      source: "proportional",
    };
  }

  const fromAlign = wordsFromAlignment(alignment);
  if (fromAlign.length === 0) {
    return {
      captions: proportionalCaptions(
        words,
        alignment.characterEndTimesSeconds.at(-1) ?? estimateDuration(scriptText),
        offsetMs,
      ),
      source: "proportional",
    };
  }

  // Prefer script word text; timing from alignment words in order
  const captions: CaptionWord[] = [];
  const n = Math.min(words.length, fromAlign.length);
  for (let i = 0; i < n; i++) {
    const a = fromAlign[i];
    captions.push({
      text: words[i],
      startMs: Math.round(a.startSec * 1000) + offsetMs,
      endMs: Math.round(a.endSec * 1000) + offsetMs,
      timestampMs:
        Math.round(((a.startSec + a.endSec) / 2) * 1000) + offsetMs,
      confidence: null,
    });
  }

  if (words.length !== fromAlign.length) {
    // remaining script words: stretch after last
    const lastEnd =
      captions.at(-1)?.endMs ??
      offsetMs +
        Math.round(
          (alignment.characterEndTimesSeconds.at(-1) ?? 1) * 1000,
        );
    for (let i = n; i < words.length; i++) {
      const startMs = lastEnd + (i - n) * 200;
      captions.push({
        text: words[i],
        startMs,
        endMs: startMs + 200,
        timestampMs: startMs + 100,
        confidence: null,
      });
    }
  }

  return { captions, source: "tts" };
}

function wordsFromAlignment(alignment: CharacterAlignment) {
  const out: Array<{ text: string; startSec: number; endSec: number }> = [];
  let buf = "";
  let start: number | null = null;
  let end = 0;

  const flush = () => {
    if (!buf) return;
    out.push({ text: buf, startSec: start ?? 0, endSec: end });
    buf = "";
    start = null;
  };

  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i];
    const s = alignment.characterStartTimesSeconds[i] ?? end;
    const e = alignment.characterEndTimesSeconds[i] ?? s;
    if (ch === " " || ch === "\n" || ch === "\t") {
      flush();
      end = e;
      continue;
    }
    if (start === null) start = s;
    buf += ch;
    end = e;
  }
  flush();
  return out;
}

function proportionalCaptions(
  words: string[],
  durationSec: number,
  offsetMs: number,
): CaptionWord[] {
  const totalChars = words.reduce((n, w) => n + w.length, 0) || 1;
  let t = 0;
  return words.map((text) => {
    const share = text.length / totalChars;
    const dur = Math.max(0.05, durationSec * share);
    const startMs = offsetMs + Math.round(t * 1000);
    const endMs = offsetMs + Math.round((t + dur) * 1000);
    t += dur;
    return {
      text,
      startMs,
      endMs,
      timestampMs: Math.round((startMs + endMs) / 2),
      confidence: null,
    };
  });
}

function estimateDuration(text: string): number {
  // ~13 chars/sec speaking rate fallback
  return Math.max(0.8, text.length / 13);
}
