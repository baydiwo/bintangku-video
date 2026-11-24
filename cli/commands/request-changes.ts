import {
  loadVideo,
  requireVideoId,
  saveVideo,
  transitionStatus,
} from "../lib/video-io";
import { CliError } from "../providers/wavespeed/types";
import * as log from "../lib/log";

export async function cmdRequestChanges(
  videoIdArg: string,
  opts: { slot?: number; note: string },
): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  let video = loadVideo(videoId);
  if (video.status !== "in_review" && video.status !== "preview_ready") {
    throw new CliError(
      "ERR-STATE",
      `Cannot request-changes from ${video.status}`,
    );
  }
  if (!opts.note) {
    throw new CliError("ERR-SCHEMA", "--note is required");
  }

  video = {
    ...transitionStatus(video, "changes_requested", "user"),
    reviewNotes: [
      ...(video.reviewNotes ?? []),
      {
        slot: opts.slot,
        note: opts.note,
        at: new Date().toISOString(),
        by: "user",
      },
    ],
    version: video.version + 1,
  };
  saveVideo(video);
  log.ok(`changes_requested (version → ${video.version})`);
}
