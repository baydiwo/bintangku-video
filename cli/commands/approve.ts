import prompts from "prompts";
import { execSync } from "child_process";
import { loadApprovers } from "../lib/config";
import {
  loadVideo,
  loadTimelineIfExists,
  requireVideoId,
  saveVideo,
  transitionStatus,
} from "../lib/video-io";
import type { TimelineDoc } from "../lib/video-types";
import { CliError } from "../providers/wavespeed/types";
import * as log from "../lib/log";

export async function cmdApprove(videoIdArg: string): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  let video = loadVideo(videoId);

  if (video.status !== "in_review" && video.status !== "preview_ready") {
    throw new CliError(
      "ERR-STATE",
      `Cannot approve from status ${video.status}`,
    );
  }

  const timeline = loadTimelineIfExists(videoId) as TimelineDoc | null;
  if (!timeline?.approvalHash) {
    throw new CliError("ERR-STATE", "timeline.json / approvalHash missing");
  }

  const approvers = loadApprovers().approvers ?? [];
  let gitEmail = "";
  let gitName = "";
  try {
    gitEmail = execSync("git config user.email", { encoding: "utf8" }).trim();
    gitName = execSync("git config user.name", { encoding: "utf8" }).trim();
  } catch {
    /* ignore */
  }

  if (approvers.length > 0) {
    const ok = approvers.some(
      (a) =>
        (a.email && a.email === gitEmail) ||
        (a.name && a.name === gitName),
    );
    if (!ok) {
      throw new CliError(
        "ERR-NOT-APPROVER",
        `Git identity ${gitName} <${gitEmail}> not in config/approvers.json`,
      );
    }
  } else {
    log.warn(
      "config/approvers.json empty — identity check skipped (add approvers for production)",
    );
  }

  const confirm = await prompts({
    type: "text",
    name: "id",
    message: `Type videoId to confirm approval (${videoId}):`,
  });
  if (confirm.id !== videoId) {
    throw new CliError("ERR-NOT-APPROVER", "Confirmation mismatch — aborted");
  }

  video = {
    ...transitionStatus(video, "approved", gitEmail || gitName || "user"),
    approval: {
      by: gitEmail || gitName || "user",
      at: new Date().toISOString(),
      approvalHash: timeline.approvalHash,
      checklist: {
        spelling: true,
        sync: true,
        brand: true,
        voice: true,
      },
    },
  };
  saveVideo(video);
  log.ok(`Approved ${videoId} hash=${timeline.approvalHash.slice(0, 12)}…`);
}
