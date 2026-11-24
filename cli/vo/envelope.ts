import * as fs from "fs";
import {
  ALL_FORMATS,
  AudioBufferSink,
  FilePathSource,
  Input,
} from "mediabunny";
import { writeJsonAtomic } from "../lib/atomic";
import { FPS } from "../../src/lib/grid";
import type { CharacterAlignment } from "../providers/wavespeed/types";

export type EnvelopeFile = {
  fps: number;
  durationSec: number;
  frames: number[];
  peak: number;
};

/**
 * Prefer real RMS from MP3 via mediabunny. Fallback: activity from alignment.
 */
export async function buildAndWriteEnvelope(opts: {
  mp3Path: string;
  outPath: string;
  alignment: CharacterAlignment | null;
  durationSecHint?: number;
}): Promise<EnvelopeFile> {
  let envelope: EnvelopeFile | null = null;

  try {
    envelope = await rmsEnvelopeFromMp3(opts.mp3Path);
  } catch {
    envelope = null;
  }

  if (!envelope) {
    const duration =
      opts.durationSecHint ??
      (opts.alignment
        ? opts.alignment.characterEndTimesSeconds[
            opts.alignment.characterEndTimesSeconds.length - 1
          ]
        : 1);
    envelope = alignmentProxyEnvelope(opts.alignment, duration);
  }

  writeJsonAtomic(opts.outPath, envelope);
  return envelope;
}

async function rmsEnvelopeFromMp3(mp3Path: string): Promise<EnvelopeFile> {
  if (!fs.existsSync(mp3Path)) {
    throw new Error("mp3 missing");
  }

  const input = new Input({
    source: new FilePathSource(mp3Path),
    formats: ALL_FORMATS,
  });

  try {
    const durationSec = await input.computeDuration();
    const audioTrack = await input.getPrimaryAudioTrack();
    if (!audioTrack) {
      throw new Error("no audio track");
    }

    const sink = new AudioBufferSink(audioTrack);
    const frameCount = Math.max(1, Math.ceil(durationSec * FPS));
    const energy = new Array<number>(frameCount).fill(0);
    const counts = new Array<number>(frameCount).fill(0);

    for await (const wrapped of sink.buffers()) {
      const buffer = wrapped.buffer;
      const start = wrapped.timestamp;
      const channels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const channel0 = buffer.getChannelData(0);

      for (let i = 0; i < channel0.length; i++) {
        let sq = 0;
        for (let c = 0; c < channels; c++) {
          const v = buffer.getChannelData(c)[i] || 0;
          sq += v * v;
        }
        const rms = Math.sqrt(sq / channels);
        const t = start + i / sampleRate;
        const fi = Math.min(frameCount - 1, Math.max(0, Math.floor(t * FPS)));
        energy[fi] += rms;
        counts[fi] += 1;
      }
    }

    const frames = energy.map((e, i) => (counts[i] ? e / counts[i] : 0));
    const peak = Math.max(...frames, 1e-9);
    const normalized = frames.map((v) => v / peak);

    return {
      fps: FPS,
      durationSec,
      frames: normalized,
      peak,
    };
  } finally {
    input.dispose();
  }
}

function alignmentProxyEnvelope(
  alignment: CharacterAlignment | null,
  durationSec: number,
): EnvelopeFile {
  const frameCount = Math.max(1, Math.ceil(durationSec * FPS));
  const frames = new Array<number>(frameCount).fill(0);

  if (!alignment) {
    // soft pulse as placeholder
    for (let i = 0; i < frameCount; i++) {
      frames[i] = 0.35;
    }
    return { fps: FPS, durationSec, frames, peak: 1 };
  }

  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i];
    if (ch === " " || ch === "\n" || ch === "\t") continue;
    const start = alignment.characterStartTimesSeconds[i] ?? 0;
    const end =
      alignment.characterEndTimesSeconds[i] ??
      start + 1 / FPS;
    const a = Math.floor(start * FPS);
    const b = Math.ceil(end * FPS);
    for (let f = a; f < b && f < frameCount; f++) {
      if (f >= 0) frames[f] = Math.max(frames[f], /[aeiouoáuú]/i.test(ch) ? 0.85 : 0.55);
    }
  }

  return { fps: FPS, durationSec, frames, peak: 1 };
}

export function durationFromAlignment(
  alignment: CharacterAlignment | null,
): number | null {
  if (!alignment?.characterEndTimesSeconds?.length) return null;
  return alignment.characterEndTimesSeconds[
    alignment.characterEndTimesSeconds.length - 1
  ];
}
