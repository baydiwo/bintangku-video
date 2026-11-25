import { loadVideo, requireVideoId } from "../lib/video-io";
import { validateVideoDoc } from "../lib/validate-schema";
import { ceilVoToSlots, FPS } from "../../src/lib/grid";
import { loadLipsync } from "../lib/config";
import * as log from "../lib/log";

export async function cmdValidate(videoIdArg: string): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  const video = loadVideo(videoId);
  validateVideoDoc(video);

  const lipsync = loadLipsync();
  const pacing = video.pacing ?? (video.scenes?.length ? "scene" : "grid");

  if (pacing === "scene" && video.scenes?.length) {
    let hintSec = 0;
    for (const scene of video.scenes) {
      const text = scene.speech ?? scene.voText;
      hintSec +=
        scene.durationHintSec ??
        Math.max(0.8, [...text].length / 13);
    }
    const target = video.targetDuration === 30 ? 900 : 1800;
    const estFrames = Math.round(hintSec * FPS);
    log.ok(
      `validate OK — scene pacing · ${video.scenes.length} scenes · hints ~${hintSec.toFixed(1)}s / ${estFrames}f (target ${video.targetDuration}s / ${target}f)`,
    );
    if (Math.abs(hintSec - video.targetDuration) > video.targetDuration * 0.15) {
      log.warn(
        `WARN: duration hints ${hintSec.toFixed(1)}s vs target ${video.targetDuration}s`,
      );
    }
    return;
  }

  let estSlots = 0;
  for (const beat of video.beats ?? []) {
    const text = beat.speech ?? beat.text;
    const dur = Math.max(0.8, [...text].length / 13);
    estSlots += ceilVoToSlots(
      dur,
      lipsync.padStartFrames ?? 6,
      lipsync.padEndFrames ?? 6,
      beat.minSlots ?? 1,
    );
  }

  log.ok(
    `validate OK — ${(video.beats ?? []).length} beats, ~${estSlots} slots (estimate)`,
  );
  if (estSlots < 11) log.warn(`WARN: estimated slots ${estSlots} < 11`);
  if (estSlots > 22) log.warn(`WARN: estimated slots ${estSlots} > 22`);
}
