import {
  loadVideo,
  requireVideoId,
  saveVideo,
  transitionStatus,
} from "../lib/video-io";
import { validateVideoDoc } from "../lib/validate-schema";
import { buildTimeline } from "../timeline/build";
import * as log from "../lib/log";

export async function cmdTimeline(videoIdArg: string): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  let video = loadVideo(videoId);
  validateVideoDoc(video);

  const { timeline, warnings } = buildTimeline(video);
  for (const w of warnings) log.warn(w);

  log.ok(
    `timeline.json — ${timeline.meta.totalSlots} slots, ${timeline.meta.durationInFrames} frames, hash ${timeline.approvalHash.slice(0, 12)}…`,
  );

  // status stays until qa; if was draft/vo_ready keep vo_ready
  if (video.status === "draft" || video.status === "vo_ready") {
    // leave as vo_ready; qa moves to preview_ready
    if (video.status === "draft") {
      video = transitionStatus(video, "vo_ready", "cli:timeline");
      saveVideo(video);
    }
  }
}
