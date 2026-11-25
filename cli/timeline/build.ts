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
  sceneAlignmentPath,
  sceneEnvelopePath,
  sceneMp3Path,
  timelineJsonPath,
  voManifestPath,
} from "../lib/paths";
import type {
  Scene,
  TimelineDoc,
  TimelineScene,
  VideoDoc,
  VoManifest,
} from "../lib/video-types";
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
  const pacing = video.pacing ?? (video.scenes?.length ? "scene" : "grid");
  if (pacing === "scene") {
    return buildSceneTimeline(video, { requireVo: true });
  }
  return buildGridTimeline(video);
}

/**
 * Draft timeline from durationHintSec — for Studio preview before VO (DEC-57).
 * Does not require VO manifest.
 */
export function buildDraftSceneTimeline(video: VideoDoc): TimelineBuildResult {
  return buildSceneTimeline(video, { requireVo: false });
}

function targetFrames(video: VideoDoc): number {
  return video.targetDuration === 30 ? 900 : 1800;
}

function buildSceneTimeline(
  video: VideoDoc,
  opts: { requireVo: boolean },
): TimelineBuildResult {
  const render = loadRender();
  const lipsync = loadLipsync();
  const warnings: string[] = [];
  const scenes = video.scenes;
  if (!scenes?.length) {
    throw new CliError("ERR-SCHEMA", "pacing=scene requires scenes[]");
  }

  let manifest: VoManifest | null = null;
  if (opts.requireVo) {
    if (!fs.existsSync(voManifestPath(video.id))) {
      throw new CliError(
        "ERR-VO-MISSING",
        `Missing VO manifest for ${video.id}. Run \`vo\` first.`,
      );
    }
    manifest = readJson<VoManifest>(voManifestPath(video.id));
  }

  const padStart = lipsync.padStartFrames ?? 6;
  const padEnd = lipsync.padEndFrames ?? 6;
  const fps = render.fps ?? FPS;
  const totalTarget = targetFrames(video);

  // Precompute per-scene content frames; draft scales to exact target (no pad bloat)
  const rawFrames = scenes.map((scene) => {
    const durationSec = resolveSceneDurationSec(video, scene, manifest, opts);
    if (!opts.requireVo) {
      return Math.max(1, Math.round(durationSec * fps));
    }
    return Math.max(1, Math.ceil(durationSec * fps) + padStart + padEnd);
  });
  let frameBudget = rawFrames.reduce((a, b) => a + b, 0);
  const scaledFrames = [...rawFrames];
  if (!opts.requireVo && frameBudget !== totalTarget && frameBudget > 0) {
    const scale = totalTarget / frameBudget;
    let assigned = 0;
    for (let i = 0; i < scaledFrames.length; i++) {
      if (i === scaledFrames.length - 1) {
        scaledFrames[i] = Math.max(1, totalTarget - assigned);
      } else {
        scaledFrames[i] = Math.max(1, Math.round(rawFrames[i]! * scale));
        assigned += scaledFrames[i]!;
      }
    }
    frameBudget = totalTarget;
  }

  const timelineScenes: TimelineScene[] = [];
  const slots: TimelineDoc["slots"] = [];
  const elements: unknown[] = [];
  const text: unknown[] = [];
  const audio: unknown[] = [];
  const mouthTracks: TimelineDoc["mouthTracks"] = [];
  const voHashes: string[] = [];

  let cursorFrame = 0;
  let slotIndex = 0;

  for (let si = 0; si < scenes.length; si++) {
    const scene = scenes[si]!;
    const durationSec = resolveSceneDurationSec(video, scene, manifest, opts);
    const contentFrames = scaledFrames[si]!;
    const sceneStart = cursorFrame;

    timelineScenes.push({
      id: scene.id,
      beatId: scene.beatId,
      from: sceneStart,
      durationInFrames: contentFrames,
    });

    slots.push({
      index: slotIndex,
      beatId: `${scene.id}@${scene.beatId}`,
      from: sceneStart,
      durationInFrames: contentFrames,
    });

    const bg = scene.background ?? {
      type: "cosmic",
      palette: "night",
    };
    elements.push({
      slotIndex,
      kind: "background",
      props: bg,
      enter: "pop",
      exit: "none",
      motion: "none",
      sceneId: scene.id,
    });

    for (const cast of scene.cast ?? []) {
      elements.push({
        slotIndex,
        kind: "character",
        props: {
          character: cast.character,
          pose: cast.pose ?? "idle",
          expression: cast.expression ?? "neutral",
          x: cast.x ?? 0.5,
          y: cast.y ?? 0.62,
        },
        enter: "pop",
        exit: "none",
        motion: "float",
        sceneId: scene.id,
      });
    }

    if (scene.captionStep) {
      text.push({
        kind: "onScreen",
        from: sceneStart,
        to: sceneStart + contentFrames,
        content: scene.captionStep,
        sceneId: scene.id,
      });
    }

    if (opts.requireVo && manifest) {
      const mp3 = sceneMp3Path(video.id, scene.id);
      if (!fs.existsSync(mp3)) {
        throw new CliError("ERR-VO-MISSING", `Missing ${mp3}`);
      }
      voHashes.push(sha256File(mp3));
      audio.push({
        kind: scene.delivery === "sung" ? "vo-sung" : "vo",
        src: `voiceover/${video.id}/${scene.id}.mp3`,
        from: sceneStart + padStart,
        durationInFrames: Math.ceil(durationSec * fps),
        volume: 1,
        sceneId: scene.id,
      });

      const alignment = loadSceneAlignment(video.id, scene.id);
      const envelope = loadSceneEnvelope(video.id, scene.id);
      const captionOffsetMs = Math.round(
        ((sceneStart + padStart) / fps) * 1000,
      );
      const { captions, source } = alignmentToCaptions(
        scene.voText,
        alignment,
        captionOffsetMs,
      );
      if (source !== "tts") {
        warnings.push(
          `WARN-ALIGN-FALLBACK: scene ${scene.id} captions source=${source}`,
        );
      }
      if (video.captions?.enabled !== false) {
        text.push({
          kind: "caption",
          from: sceneStart,
          to: sceneStart + contentFrames,
          captions,
          sceneId: scene.id,
        });
      }
      // Maskot bisu (DEC-56) — mouthTrack idle only, keyed by scene
      mouthTracks.push({
        sceneId: scene.id,
        beatId: scene.beatId,
        frames: buildMouthTrack({
          envelope,
          alignment,
          lipsync,
          absoluteStartFrame: sceneStart + padStart,
        }),
      });
    } else {
      warnings.push(
        `WARN-DRAFT-TIMELINE: scene ${scene.id} using durationHintSec (no VO yet)`,
      );
    }

    slotIndex += 1;
    cursorFrame += contentFrames;
  }

  if (cursorFrame > totalTarget) {
    warnings.push(
      `WARN-DURATION-OVERFLOW: scenes total ${cursorFrame}f > target ${totalTarget}f`,
    );
  } else if (cursorFrame < totalTarget) {
    // Pad sisa ke end card (B9) — extend last scene or append pad slot
    const pad = totalTarget - cursorFrame;
    const last = timelineScenes[timelineScenes.length - 1];
    if (last) {
      last.durationInFrames += pad;
      const lastSlot = slots[slots.length - 1];
      if (lastSlot) lastSlot.durationInFrames += pad;
    }
    cursorFrame = totalTarget;
  }

  const meta = {
    videoId: video.id,
    version: video.version,
    fps,
    slotFrames: SLOT_FRAMES,
    totalSlots: slots.length,
    durationInFrames: cursorFrame,
    width: render.width,
    height: render.height,
    pacing: "scene" as const,
    generatedAt: new Date().toISOString(),
    generator: opts.requireVo
      ? "bintangku-cli@2-scene"
      : "bintangku-cli@2-scene-draft",
    rigVersion: readRigVersion(),
    remotionVersion: readRemotionVersion(),
  };

  const withoutHash = {
    meta: { ...meta, generatedAt: undefined },
    scenes: timelineScenes,
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
    scenes: timelineScenes,
    slots,
    elements,
    text,
    audio,
    mouthTracks,
    approvalHash,
  };

  writeJsonAtomic(timelineJsonPath(video.id), timeline);
  fs.mkdirSync(path.dirname(publicTimelinePath(video.id)), { recursive: true });
  writeJsonAtomic(publicTimelinePath(video.id), timeline);
  writeStudioSceneIndex(video.id, timelineScenes.map((s) => s.id));

  return { timeline, warnings };
}

function writeStudioSceneIndex(videoId: string, sceneIds: string[]): void {
  const indexPath = path.join(process.cwd(), "src", "studio-scene-ids.json");
  let index: Record<string, string[]> = {};
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, "utf8")) as Record<
        string,
        string[]
      >;
    } catch {
      index = {};
    }
  }
  index[videoId] = sceneIds;
  writeJsonAtomic(indexPath, index);
}

function resolveSceneDurationSec(
  video: VideoDoc,
  scene: Scene,
  manifest: VoManifest | null,
  opts: { requireVo: boolean },
): number {
  if (opts.requireVo && manifest) {
    const entry = manifest.scenes?.find((s) => s.sceneId === scene.id);
    if (!entry) {
      throw new CliError(
        "ERR-VO-MISSING",
        `No VO for scene ${scene.id}. Run \`vo\` first.`,
      );
    }
    return entry.durationSec;
  }
  return scene.durationHintSec ?? 3;
}

function buildGridTimeline(video: VideoDoc): TimelineBuildResult {
  const render = loadRender();
  const lipsync = loadLipsync();
  const warnings: string[] = [];

  if (!video.beats?.length) {
    throw new CliError("ERR-SCHEMA", "Legacy grid timeline requires beats[]");
  }

  if (!fs.existsSync(voManifestPath(video.id))) {
    throw new CliError(
      "ERR-VO-MISSING",
      `Missing VO manifest for ${video.id}. Run \`vo\` first.`,
    );
  }
  const manifest = readJson<VoManifest>(voManifestPath(video.id));
  if (!manifest.beats?.length) {
    throw new CliError("ERR-VO-MISSING", "VO manifest missing beats[]");
  }

  const slots: TimelineDoc["slots"] = [];
  const elements: unknown[] = [];
  const text: unknown[] = [];
  const audio: unknown[] = [];
  const mouthTracks: TimelineDoc["mouthTracks"] = [];
  const voHashes: string[] = [];

  let slotIndex = 0;
  let cursorFrame = 0;

  for (const beat of video.beats) {
    const entry = manifest.beats!.find((b) => b.beatId === beat.id);
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
    pacing: "grid" as const,
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

function loadSceneAlignment(
  videoId: string,
  sceneId: string,
): CharacterAlignment | null {
  const p = sceneAlignmentPath(videoId, sceneId);
  if (!fs.existsSync(p)) return null;
  return readJson<CharacterAlignment>(p);
}

function loadSceneEnvelope(videoId: string, sceneId: string): EnvelopeFile {
  const p = sceneEnvelopePath(videoId, sceneId);
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
