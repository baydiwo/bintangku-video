import * as fs from "fs";
import { writeJsonAtomic, readJson } from "../lib/atomic";
import {
  loadBudget,
  loadModels,
  loadVoice,
  type VoiceConfig,
} from "../lib/config";
import { sha256File } from "../lib/hash";
import {
  beatAlignmentPath,
  beatEnvelopePath,
  beatMp3Path,
  publicVoiceoverDir,
  voManifestPath,
} from "../lib/paths";
import type { VideoDoc, VoManifest, VoManifestBeat } from "../lib/video-types";
import {
  CliError,
  downloadToFile,
  generateTtsWithTiming,
} from "../providers/wavespeed";
import type { CharacterAlignment } from "../providers/wavespeed/types";
import { assertBudgetAllows, estimateTtsCostUsd } from "./budget";
import { makeCacheKey } from "./cache";
import {
  buildAndWriteEnvelope,
  durationFromAlignment,
} from "./envelope";

export type VoResult = {
  generated: string[];
  cached: string[];
  estimatedCostUsd: number;
  spentUsd: number;
  balance?: number;
};

export async function generateVoiceovers(
  video: VideoDoc,
  opts: { dryRun?: boolean; voiceIdOverride?: string } = {},
): Promise<VoResult> {
  const voice = loadVoice();
  const models = loadModels();
  const budget = loadBudget();

  const model = models.tts?.model || voice.model;
  const voiceId = opts.voiceIdOverride || voice.voice_id;
  if (!voiceId) {
    throw new CliError(
      "ERR-SCHEMA",
      "config/voice.json voice_id is null. Set it after TASK-USR-003 (or pass --voice-id).",
    );
  }

  const voiceEffective: VoiceConfig = {
    ...voice,
    model,
    voice_id: voiceId,
  };

  fs.mkdirSync(publicVoiceoverDir(video.id), { recursive: true });

  let manifest: VoManifest = fs.existsSync(voManifestPath(video.id))
    ? readJson<VoManifest>(voManifestPath(video.id))
    : { videoId: video.id, beats: [] };

  const byBeat = new Map(manifest.beats.map((b) => [b.beatId, b]));
  const generated: string[] = [];
  const cached: string[] = [];
  let estimatedTotal = 0;
  let spent = 0;

  // Precompute costs for beats that need generation
  const plan: Array<{
    beatId: string;
    text: string;
    chars: number;
    cacheKey: string;
    cost: number;
    hit: VoManifestBeat | undefined;
  }> = [];

  for (const beat of video.beats) {
    const text = (beat.speech ?? beat.text).trim();
    const cacheKey = makeCacheKey(text, voiceEffective);
    const hit = byBeat.get(beat.id);
    const isHit =
      hit &&
      hit.cacheKey === cacheKey &&
      fs.existsSync(beatMp3Path(video.id, beat.id));

    const chars = [...text].length;
    const cost = isHit ? 0 : estimateTtsCostUsd(budget, model, chars);
    estimatedTotal += cost;
    plan.push({
      beatId: beat.id,
      text,
      chars,
      cacheKey,
      cost,
      hit: isHit ? hit : undefined,
    });
  }

  let balance: number | undefined;
  if (!opts.dryRun && estimatedTotal > 0) {
    const spentSoFar = manifest.beats.reduce(
      (s, b) => s + (b.estimatedCostUsd || 0),
      0,
    );
    const check = await assertBudgetAllows({
      budget,
      estimatedCostUsd: estimatedTotal,
      spentThisVideoUsd: spentSoFar,
    });
    balance = check.balance;
  }

  if (opts.dryRun) {
    return {
      generated: plan.filter((p) => !p.hit).map((p) => p.beatId),
      cached: plan.filter((p) => p.hit).map((p) => p.beatId),
      estimatedCostUsd: estimatedTotal,
      spentUsd: 0,
      balance,
    };
  }

  const nextBeats: VoManifestBeat[] = [];

  for (const item of plan) {
    if (item.hit) {
      cached.push(item.beatId);
      nextBeats.push(item.hit);
      continue;
    }

    const { predictionId, result } = await generateTtsWithTiming({
      model,
      text: item.text,
      voiceId,
      stability:
        typeof voiceEffective.settings?.stability === "number"
          ? voiceEffective.settings.stability
          : 0.5,
    });

    const mp3Path = beatMp3Path(video.id, item.beatId);
    try {
      await downloadToFile(result.audioUrl, mp3Path);
    } catch (err) {
      throw err;
    }

    const alignmentPath = beatAlignmentPath(video.id, item.beatId);
    let alignment: CharacterAlignment | null = result.alignment;
    let alignmentSource: VoManifestBeat["alignmentSource"] = alignment
      ? "tts"
      : "proportional";

    if (!alignment && voice.returns_alignment === false) {
      alignmentSource = "proportional";
    }

    if (alignment) {
      writeJsonAtomic(alignmentPath, alignment);
    } else {
      // still write empty proportional marker
      writeJsonAtomic(alignmentPath, {
        characters: [],
        characterStartTimesSeconds: [],
        characterEndTimesSeconds: [],
        note: "no alignment from TTS — captions will use proportional timing",
      });
      alignment = null;
    }

    const durationSec =
      durationFromAlignment(alignment) ??
      (await probeDurationFallback(mp3Path, item.text));

    const envelopePath = beatEnvelopePath(video.id, item.beatId);
    await buildAndWriteEnvelope({
      mp3Path,
      outPath: envelopePath,
      alignment,
      durationSecHint: durationSec,
    });

    const entry: VoManifestBeat = {
      beatId: item.beatId,
      cacheKey: item.cacheKey,
      file: `public/voiceover/${video.id}/${item.beatId}.mp3`,
      fileSha256: sha256File(mp3Path),
      alignmentFile: `public/voiceover/${video.id}/${item.beatId}.alignment.json`,
      alignmentSource,
      envelopeFile: `public/voiceover/${video.id}/${item.beatId}.envelope.json`,
      durationSec,
      characters: item.chars,
      model,
      predictionId,
      estimatedCostUsd: item.cost,
      createdAt: new Date().toISOString(),
    };

    spent += item.cost;
    generated.push(item.beatId);
    nextBeats.push(entry);
  }

  manifest = { videoId: video.id, beats: nextBeats };
  writeJsonAtomic(voManifestPath(video.id), manifest);

  return {
    generated,
    cached,
    estimatedCostUsd: estimatedTotal,
    spentUsd: spent,
    balance,
  };
}

async function probeDurationFallback(
  mp3Path: string,
  text: string,
): Promise<number> {
  try {
    const { Input, FilePathSource, ALL_FORMATS } = await import("mediabunny");
    const input = new Input({
      source: new FilePathSource(mp3Path),
      formats: ALL_FORMATS,
    });
    try {
      return await input.computeDuration();
    } finally {
      input.dispose();
    }
  } catch {
    return Math.max(0.8, text.length / 13);
  }
}
