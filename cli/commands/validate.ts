import { loadVideo, requireVideoId } from "../lib/video-io";
import { validateVideoDoc } from "../lib/validate-schema";
import { ceilVoToSlots } from "../../src/lib/grid";
import { loadLipsync } from "../lib/config";
import * as log from "../lib/log";

export async function cmdValidate(videoIdArg: string): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  const video = loadVideo(videoId);
  validateVideoDoc(video);

  const lipsync = loadLipsync();
  let estSlots = 0;
  for (const beat of video.beats) {
    // rough estimate ~13 chars/sec until VO exists
    const text = beat.speech ?? beat.text;
    const dur = Math.max(0.8, [...text].length / 13);
    estSlots += ceilVoToSlots(
      dur,
      lipsync.padStartFrames ?? 6,
      lipsync.padEndFrames ?? 6,
      beat.minSlots ?? 1,
    );
  }

  log.ok(`validate OK — ${video.beats.length} beats, ~${estSlots} slots (estimate)`);
  if (estSlots < 11) log.warn(`WARN: estimated slots ${estSlots} < 11`);
  if (estSlots > 22) log.warn(`WARN: estimated slots ${estSlots} > 22`);
}
