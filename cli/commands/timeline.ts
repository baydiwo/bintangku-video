import {
  loadVideo,
  requireVideoId,
  saveVideo,
  transitionStatus,
} from "../lib/video-io";
import { validateVideoDoc } from "../lib/validate-schema";
import {
  buildDraftSceneTimeline,
  buildTimeline,
} from "../timeline/build";
import * as log from "../lib/log";

export async function cmdTimeline(
  videoIdArg: string,
  opts: { draft?: boolean } = {},
): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  let video = loadVideo(videoId);
  validateVideoDoc(video);

  const pacing = video.pacing ?? (video.scenes?.length ? "scene" : "grid");
  // Scene videos in draft use durationHintSec until VO exists (DEC-57)
  const useDraft =
    opts.draft === true ||
    (pacing === "scene" && video.status === "draft");

  // Scene draft: timeline from durationHintSec before storyboard_approved / vo
  const { timeline, warnings } =
    useDraft && pacing === "scene"
      ? buildDraftSceneTimeline(video)
      : buildTimeline(video);

  for (const w of warnings) log.warn(w);

  log.ok(
    `timeline.json — ${timeline.meta.pacing ?? pacing} · ${timeline.scenes?.length ?? timeline.meta.totalSlots} scenes/slots · ${timeline.meta.durationInFrames} frames · hash ${timeline.approvalHash.slice(0, 12)}…`,
  );

  // Draft scene timeline does not advance status (await storyboard_approved → vo)
  if (useDraft && pacing === "scene") {
    return;
  }

  // status stays until qa; if was draft/vo_ready keep vo_ready
  if (video.status === "draft" || video.status === "vo_ready") {
    if (video.status === "draft") {
      video = transitionStatus(video, "vo_ready", "cli:timeline");
      saveVideo(video);
    }
  }
}
