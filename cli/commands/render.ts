import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { loadRender } from "../lib/config";
import { writeJsonAtomic } from "../lib/atomic";
import {
  loadTimelineIfExists,
  loadVideo,
  requireVideoId,
  saveVideo,
  transitionStatus,
} from "../lib/video-io";
import { rendersDir } from "../lib/paths";
import type { TimelineDoc } from "../lib/video-types";
import { CliError } from "../providers/wavespeed/types";
import * as log from "../lib/log";

export async function cmdRender(
  videoIdArg: string,
  opts: { target?: "local" | "lambda"; draft?: boolean },
): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  let video = loadVideo(videoId);
  const timeline = loadTimelineIfExists(videoId) as TimelineDoc | null;
  const renderCfg = loadRender();

  if (!opts.draft) {
    if (video.status !== "approved" && video.status !== "rendering") {
      throw new CliError(
        "ERR-NOT-APPROVED",
        `status=${video.status}; need approved`,
      );
    }
    if (!video.approval?.approvalHash) {
      throw new CliError("ERR-NOT-APPROVED", "missing approval record");
    }
    if (!timeline || video.approval.approvalHash !== timeline.approvalHash) {
      throw new CliError(
        "ERR-HASH-MISMATCH",
        "approvalHash does not match current timeline",
      );
    }
  }

  if (opts.target === "lambda") {
    throw new CliError(
      "ERR-RENDER",
      "Remotion Lambda not configured yet (OQ-14/15)",
    );
  }

  fs.mkdirSync(rendersDir(), { recursive: true });
  const label = opts.draft ? "draft" : "final";
  const outName = `${videoId}__v${video.version}__${label}.mp4`;
  const outPath = path.join(rendersDir(), outName);

  if (!opts.draft) {
    video = transitionStatus(video, "rendering", "cli:render");
    saveVideo(video);
  }

  // Composition still uses template AIVideo until VideoFromTimeline is wired.
  // Prefer composition id = videoId if registered; else fall back with clear error.
  const compositionId = videoId;
  const args = [
    "remotion",
    "render",
    compositionId,
    outPath,
    "--overwrite",
  ];
  if (opts.draft) {
    const scale = renderCfg.draft?.scale ?? 0.5;
    args.push(`--scale=${scale}`);
  }

  log.info(`Running: npx ${args.join(" ")}`);
  const result = spawnSync("npx", args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    if (!opts.draft) {
      video = transitionStatus(video, "approved", "cli:render");
      saveVideo(video);
    }
    throw new CliError(
      "ERR-RENDER",
      `remotion render exited ${result.status}. Ensure composition "${compositionId}" exists in Root.tsx (R1+).`,
    );
  }

  const meta = {
    videoId,
    version: video.version,
    label,
    outPath,
    approvalHash: timeline?.approvalHash ?? null,
    at: new Date().toISOString(),
  };
  writeJsonAtomic(`${outPath}.render.json`, meta);

  if (!opts.draft) {
    video = transitionStatus(video, "rendered", "cli:render");
    saveVideo(video);
  }

  log.ok(`Wrote ${outPath}`);
}

export async function cmdDraft(videoIdArg: string): Promise<void> {
  await cmdRender(videoIdArg, { draft: true, target: "local" });
}
