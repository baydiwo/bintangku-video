import {
  loadVideo,
  requireVideoId,
  saveVideo,
  transitionStatus,
} from "../lib/video-io";
import { CliError } from "../providers/wavespeed/types";
import * as log from "../lib/log";

export async function cmdReview(videoIdArg: string): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  let video = loadVideo(videoId);
  if (video.status !== "preview_ready" && video.status !== "changes_requested") {
    throw new CliError(
      "ERR-STATE",
      `Cannot review from status ${video.status} (need preview_ready)`,
    );
  }
  video = transitionStatus(video, "in_review", "cli:review");
  saveVideo(video);
  log.ok("Status → in_review. Open Remotion Studio (`npm run dev`) to preview.");
}
