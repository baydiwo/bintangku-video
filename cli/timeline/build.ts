import * as fs from "fs";
import * as path from "path";
import {
  ceilVoToSlots,
  FPS,
  MAX_SLOTS,
  MIN_SLOTS,
  SLOT_FRAMES,
  slotsToFrames,
} from "../../src/lib/grid";
import { loadLipsync, loadRender } from "../lib/config";
import { writeJsonAtomic, readJson } from "../lib/atomic";
import { canonicalJson, sha256File, sha256Text } from "../lib/hash";
import {
  beatAlignmentPath,
  beatEnvelopePath,
  beatMp3Path,
  publicTimelinePath,
  timelineJsonPath,
  voManifestPath,
} from "../lib/paths";
import type { TimelineDoc, VideoDoc, VoManifest } from "../lib/video-types";
import { CliError } from "../providers/wavespeed/types";
import type { CharacterAlignment } from "../providers/wavespeed/types";
import { alignmentToCaptions } from "../vo/alignment";
import type { EnvelopeFile } from "../vo/envelope";
import { buildMouthTrack } from "./lipsync";

export type TimelineBuildResult = {
  timeline: TimelineDoc;
  warnings: string[];
};

export function buildTimeline(video: VideoDoc): TimelineBuildResult {
  const render = loadRender();
  const lipsync = loadLipsync();
  const warnings: string[] = [];

  if (!fs.existsSync(voManifestPath(video.id))) {
    throw new CliError(
      "ERR-VO-MISSING",
      `Missing VO manifest for ${video.id}. Run \`vo\` first.`,
    );
  }
  const manifest = readJson<VoManifest>(voManifestPath(video.id));

  const slots: TimelineDoc["slots"] = [];
  const elements: unknown[] = [];
  const text: unknown[] = [];
  const audio: unknown[] = [];
  const mouthTracks: TimelineDoc["mouthTracks"] = [];
  const voHashes: string[] = [];

  let slotIndex = 0;
  let cursorFrame = 0;

  for (const beat of video.beats) {
    const entry = manifest.beats.find((b) => b.beatId === beat.id);
    if (!entry) {
      throw new CliError(
        "ERR-VO-MISSING",
        `No VO for beat ${beat.id}. Run \`vo\` first.`,
      );
    }

    const mp3 = beatMp3Path(video.id, beat.id);
    if (!fs.existsSync(mp3)) {
      throw new CliError("ERR-VO-MISSING", `Missing ${mp3}`);
    }
    voHashes.push(sha256File(mp3));

    const padStart = lipsync.padStartFrames ?? 6;
    const padEnd = lipsync.padEndFrames ?? 6;
    const needSlots = ceilVoToSlots(
      entry.durationSec,
      padStart,
      padEnd,
      beat.minSlots ?? 1,
    );
    if (beat.slots && beat.slots < needSlots) {
      warnings.push(
        `WARN-SLOT-EXTENDED: beat ${beat.id} extended ${beat.slots} → ${needSlots} slots`,
      );
    }
    const slotsForBeat = Math.max(needSlots, beat.slots ?? 0, beat.minSlots ?? 1);

    const beatStartFrame = cursorFrame;
    for (let s = 0; s < slotsForBeat; s++) {
      slots.push({
        index: slotIndex,
        beatId: beat.id,
        from: cursorFrame,
        durationInFrames: SLOT_FRAMES,
      });

      const shot =
        beat.shots[Math.min(s, beat.shots.length - 1)] ?? beat.shots[0];
      if (shot) {
        elements.push({
          slotIndex,
          kind: "background",
          props: shot.background,
          enter: "pop",
          exit: "none",
          motion: "none",
        });
        if (shot.character) {
          elements.push({
            slotIndex,
            kind: "character",
            props: shot.character,
            enter: "pop",
            exit: "none",
            motion: "float",
          });
        }
        for (const orn of shot.ornaments ?? []) {
          elements.push({
            slotIndex,
            kind: "ornament",
            props: orn,
            enter: "pop",
            exit: "none",
            motion: "none",
          });
        }
        if (shot.onScreenText) {
          text.push({
            kind: "onScreen",
            from: cursorFrame,
            to: cursorFrame + SLOT_FRAMES,
            ...shot.onScreenText,
          });
        }
      }

      slotIndex += 1;
      cursorFrame += SLOT_FRAMES;
    }

    audio.push({
      kind: "vo",
      src: `voiceover/${video.id}/${beat.id}.mp3`,
      from: beatStartFrame + padStart,
      durationInFrames: Math.ceil(entry.durationSec * FPS),
      volume: 1,
    });

    const alignment = loadAlignment(video.id, beat.id);
    const envelope = loadEnvelope(video.id, beat.id);
    const captionOffsetMs = Math.round(
      ((beatStartFrame + padStart) / FPS) * 1000,
    );
    const { captions, source } = alignmentToCaptions(
      beat.text,
      alignment,
      captionOffsetMs,
    );
    if (source !== "tts") {
      warnings.push(
        `WARN-ALIGN-FALLBACK: beat ${beat.id} captions source=${source}`,
      );
    }
    if (video.captions?.enabled !== false) {
      text.push({
        kind: "caption",
        from: beatStartFrame,
        to: beatStartFrame + slotsForBeat * SLOT_FRAMES,
        captions,
      });
    }

    mouthTracks.push({
      beatId: beat.id,
      frames: buildMouthTrack({
        envelope,
        alignment,
        lipsync,
        absoluteStartFrame: beatStartFrame + padStart,
      }),
    });
  }

  // DEC-42: no music track — SFX/jingle only via beats

  const totalSlots = slots.length;
  if (totalSlots < MIN_SLOTS) {
    throw new CliError(
      "ERR-GRID-MIN",
      `totalSlots ${totalSlots} < ${MIN_SLOTS}. Add beats/slots.`,
    );
  }
  if (totalSlots > MAX_SLOTS) {
    throw new CliError(
      "ERR-GRID-MAX",
      `totalSlots ${totalSlots} > ${MAX_SLOTS}. Shorten naskah.`,
    );
  }

  const meta = {
    videoId: video.id,
    version: video.version,
    fps: render.fps ?? FPS,
    slotFrames: SLOT_FRAMES,
    totalSlots,
    durationInFrames: slotsToFrames(totalSlots),
    width: render.width,
    height: render.height,
    generatedAt: new Date().toISOString(),
    generator: "bintangku-cli@1",
    rigVersion: readRigVersion(),
    remotionVersion: readRemotionVersion(),
  };

  const withoutHash = {
    meta: { ...meta, generatedAt: undefined },
    slots,
    elements,
    text,
    audio,
    mouthTracks,
  };

  const approvalHash = sha256Text(
    [
      canonicalJson(withoutHash),
      ...voHashes,
      meta.rigVersion,
      meta.remotionVersion,
    ].join("|"),
  );

  const timeline: TimelineDoc = {
    meta,
    slots,
    elements,
    text,
    audio,
    mouthTracks,
    approvalHash,
  };

  writeJsonAtomic(timelineJsonPath(video.id), timeline);
  // Remotion staticFile() mirror (source of truth remains videos/<id>/timeline.json)
  fs.mkdirSync(path.dirname(publicTimelinePath(video.id)), { recursive: true });
  writeJsonAtomic(publicTimelinePath(video.id), timeline);

  return { timeline, warnings };
}

function loadAlignment(
  videoId: string,
  beatId: string,
): CharacterAlignment | null {
  const p = beatAlignmentPath(videoId, beatId);
  if (!fs.existsSync(p)) return null;
  return readJson<CharacterAlignment>(p);
}

function loadEnvelope(videoId: string, beatId: string): EnvelopeFile {
  const p = beatEnvelopePath(videoId, beatId);
  if (!fs.existsSync(p)) {
    throw new CliError("ERR-VO-MISSING", `Missing envelope ${p}`);
  }
  return readJson<EnvelopeFile>(p);
}

function readRigVersion(): string {
  const p = path.join(
    process.cwd(),
    "characters",
    "thinker",
    "CHANGELOG.md",
  );
  if (!fs.existsSync(p)) return "0.0.0";
  const m = fs.readFileSync(p, "utf8").match(/##\s+(\d+\.\d+\.\d+)/);
  return m?.[1] ?? "0.0.0";
}

function readRemotionVersion(): string {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "node_modules", "remotion", "package.json"),
        "utf8",
      ),
    ) as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}
