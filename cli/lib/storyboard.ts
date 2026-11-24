import * as fs from "fs";
import { storyboardPath } from "./paths";
import { CliError } from "../providers/wavespeed/types";

export type StoryboardStatus =
  | "storyboard_draft"
  | "storyboard_in_review"
  | "storyboard_approved"
  | "missing";

const STATUS_RE =
  /Status:\s*`?(storyboard_draft|storyboard_in_review|storyboard_approved)`?/i;

export function readStoryboardStatus(videoId: string): StoryboardStatus {
  const p = storyboardPath(videoId);
  if (!fs.existsSync(p)) return "missing";
  const text = fs.readFileSync(p, "utf8");
  const m = text.match(STATUS_RE);
  if (!m) return "storyboard_draft";
  return m[1].toLowerCase() as StoryboardStatus;
}

/** OQ-03: VO / gen / aset berbayar butuh storyboard_approved. */
export function requireStoryboardApproved(videoId: string): void {
  const status = readStoryboardStatus(videoId);
  if (status === "storyboard_approved") return;

  if (status === "missing") {
    throw new CliError(
      "ERR-STATE",
      `Missing videos/${videoId}/storyboard.md. Write storyboard + set Status: storyboard_approved before vo/gen (OQ-03).`,
    );
  }

  throw new CliError(
    "ERR-STATE",
    `Storyboard status is "${status}". Need storyboard_approved before vo/gen (OQ-03 / rules/storyboard.md).`,
  );
}
