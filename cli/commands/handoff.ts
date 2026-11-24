import * as fs from "fs";
import * as path from "path";
import { writeJsonAtomic, readJson } from "../lib/atomic";
import { loadVideo, requireVideoId } from "../lib/video-io";
import { timelineJsonPath, videoDir, rootDir } from "../lib/paths";
import type { TimelineDoc } from "../lib/video-types";
import { CliError } from "../providers/wavespeed/types";
import * as log from "../lib/log";

/**
 * Local handoff package (FR-HND-001). Drive upload awaits drive-auth (TASK-USR-006).
 */
export async function cmdHandoff(
  videoIdArg: string,
  opts: { noUpload?: boolean },
): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  const video = loadVideo(videoId);

  if (video.status !== "approved" && video.status !== "rendered") {
    throw new CliError(
      "ERR-STATE",
      `handoff requires status approved|rendered (got ${video.status})`,
    );
  }

  const timelinePath = timelineJsonPath(videoId);
  if (!fs.existsSync(timelinePath)) {
    throw new CliError("ERR-ASSET-MISSING", `Missing ${timelinePath}`);
  }
  const timeline = readJson<TimelineDoc>(timelinePath);

  const outDir = path.join(rootDir(), "handoff", videoId);
  fs.mkdirSync(outDir, { recursive: true });

  const captionLines: string[] = [];
  for (const beat of video.beats) {
    captionLines.push(beat.text);
  }
  const captionPath = path.join(outDir, "caption.txt");
  fs.writeFileSync(captionPath, captionLines.join("\n") + "\n", "utf8");

  const mp4Candidates = [
    path.join(rootDir(), "renders", videoId, "final.mp4"),
    path.join(videoDir(videoId), "final.mp4"),
  ];
  const mp4 = mp4Candidates.find((p) => fs.existsSync(p));
  if (mp4) {
    fs.copyFileSync(mp4, path.join(outDir, "final.mp4"));
  } else {
    log.warn("No final.mp4 found — package will omit video until render.");
  }

  const handoffMeta = {
    videoId,
    approvalHash: video.approval?.approvalHash ?? timeline.approvalHash,
    timelineApprovalHash: timeline.approvalHash,
    durationInFrames: timeline.meta.durationInFrames,
    totalSlots: timeline.meta.totalSlots,
    status: video.status,
    createdAt: new Date().toISOString(),
    driveUpload: opts.noUpload
      ? { status: "skipped" as const }
      : {
          status: "pending_auth" as const,
          note: "Run drive-auth then re-run handoff (TASK-USR-006 / OQ-33)",
        },
    driveFileIds: {},
  };

  writeJsonAtomic(path.join(outDir, "handoff.json"), handoffMeta);
  log.ok(`Local handoff package → handoff/${videoId}/`);
  if (!opts.noUpload) {
    log.info(
      "Drive upload not configured yet — set GOOGLE_OAUTH_* and run drive-auth.",
    );
  }
}
