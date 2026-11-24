import type { EnvelopeFile } from "../vo/envelope";
import type { CharacterAlignment } from "../providers/wavespeed/types";
import type { LipsyncConfig } from "../lib/config";

export type MouthShape = "closed" | "half" | "open" | "round";

const DEFAULT_T1 = 0.12;
const DEFAULT_T2 = 0.4;

export function buildMouthTrack(opts: {
  envelope: EnvelopeFile;
  alignment: CharacterAlignment | null;
  lipsync: LipsyncConfig;
  absoluteStartFrame: number;
}): Array<{ frame: number; shape: MouthShape }> {
  const t1 = opts.lipsync.T1 ?? DEFAULT_T1;
  const t2 = opts.lipsync.T2 ?? DEFAULT_T2;
  const minHold = opts.lipsync.minHoldFrames ?? 2;

  const roundFrames = new Set<number>();
  if (opts.alignment) {
    for (let i = 0; i < opts.alignment.characters.length; i++) {
      const ch = opts.alignment.characters[i].toLowerCase();
      if (ch === "o" || ch === "u" || ch === "ó" || ch === "ú") {
        const s = Math.floor(
          (opts.alignment.characterStartTimesSeconds[i] ?? 0) * opts.envelope.fps,
        );
        const e = Math.ceil(
          (opts.alignment.characterEndTimesSeconds[i] ?? 0) * opts.envelope.fps,
        );
        for (let f = s; f < e; f++) roundFrames.add(f);
      }
    }
  }

  const raw: MouthShape[] = opts.envelope.frames.map((e, i) => {
    if (e < t1) return "closed";
    if (roundFrames.has(i)) return "round";
    return e >= t2 ? "open" : "half";
  });

  // Stabilize: hold minHold frames
  const stable: MouthShape[] = [];
  let i = 0;
  while (i < raw.length) {
    const shape = raw[i];
    let j = i + 1;
    while (j < raw.length && raw[j] === shape) j++;
    const hold = Math.max(minHold, j - i);
    for (let k = 0; k < hold && i + k < raw.length; k++) {
      stable[i + k] = shape;
    }
    // fill remainder of run
    for (let k = hold; i + k < j; k++) {
      stable[i + k] = shape;
    }
    i = j;
  }

  // Ensure closed stretches for silence ≥ 2 frames already handled via t1

  const out: Array<{ frame: number; shape: MouthShape }> = [];
  let last: MouthShape | null = null;
  for (let f = 0; f < stable.length; f++) {
    const shape = stable[f] ?? "closed";
    if (shape !== last) {
      out.push({ frame: opts.absoluteStartFrame + f, shape });
      last = shape;
    }
  }
  if (!out.length) {
    out.push({ frame: opts.absoluteStartFrame, shape: "closed" });
  }
  return out;
}
