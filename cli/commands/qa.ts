import * as fs from "fs";
import {
  loadVideo,
  requireVideoId,
  saveVideo,
  transitionStatus,
} from "../lib/video-io";
import { loadTimelineIfExists } from "../lib/video-io";
import { writeJsonAtomic } from "../lib/atomic";
import { qaReportPath, timelineJsonPath } from "../lib/paths";
import { MIN_SLOTS, MAX_SLOTS, SLOT_FRAMES } from "../../src/lib/grid";
import type { TimelineDoc } from "../lib/video-types";
import { CliError } from "../providers/wavespeed/types";
import * as log from "../lib/log";

export async function cmdQa(
  videoIdArg: string,
  opts: { moderate?: boolean },
): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  let video = loadVideo(videoId);
  const timeline = loadTimelineIfExists(videoId) as TimelineDoc | null;

  if (!timeline || !fs.existsSync(timelineJsonPath(videoId))) {
    throw new CliError("ERR-QA-FAIL", "timeline.json missing — run timeline first");
  }

  const checks: Array<{ id: string; ok: boolean; detail: string }> = [];
  const pacing =
    timeline.meta.pacing ??
    video.pacing ??
    (timeline.scenes?.length || video.scenes?.length ? "scene" : "grid");

  if (pacing === "scene") {
    const target = video.targetDuration === 30 ? 900 : 1800;
    const durOk = timeline.meta.durationInFrames === target;
    checks.push({
      id: "duration_frames",
      ok: durOk,
      detail: `${timeline.meta.durationInFrames}f (target ${target})`,
    });

    const sceneCount = timeline.scenes?.length ?? 0;
    checks.push({
      id: "scenes",
      ok: sceneCount > 0,
      detail: `${sceneCount} scenes`,
    });

    const voCount = timeline.audio.filter(
      (a) =>
        (a as { kind?: string }).kind === "vo" ||
        (a as { kind?: string }).kind === "vo-sung",
    ).length;
    checks.push({
      id: "vo_tracks",
      ok: voCount > 0,
      detail: `${voCount} VO tracks`,
    });
  } else {
    const gridOk = timeline.slots.every(
      (s) => s.from % SLOT_FRAMES === 0 && s.durationInFrames === SLOT_FRAMES,
    );
    checks.push({
      id: "grid",
      ok: gridOk,
      detail: gridOk ? "all cuts on 81-frame boundaries" : "misaligned slots",
    });

    const slots = timeline.meta.totalSlots;
    const slotsOk = slots >= MIN_SLOTS && slots <= MAX_SLOTS;
    checks.push({
      id: "duration_slots",
      ok: slotsOk,
      detail: `${slots} slots (valid ${MIN_SLOTS}–${MAX_SLOTS})`,
    });

    checks.push({
      id: "vo_tracks",
      ok: timeline.audio.some((a) => (a as { kind?: string }).kind === "vo"),
      detail: "VO audio tracks present",
    });
  }

  checks.push({
    id: "hash",
    ok: Boolean(timeline.approvalHash && timeline.approvalHash.length === 64),
    detail: "approvalHash present",
  });

  if (opts.moderate) {
    checks.push({
      id: "moderation",
      ok: true,
      detail: "skipped — moderator not invoked (enable after draft MP4 exists)",
    });
    log.warn("Moderation flag set but draft upload not implemented in this pass");
  }

  const failed = checks.filter((c) => !c.ok);
  const report = {
    videoId,
    at: new Date().toISOString(),
    checks,
    passed: failed.length === 0,
  };
  writeJsonAtomic(qaReportPath(videoId), report);

  if (failed.length) {
    for (const f of failed) log.fail(`QA fail ${f.id}: ${f.detail}`);
    throw new CliError("ERR-QA-FAIL", `${failed.length} check(s) failed`);
  }

  video = transitionStatus(video, "preview_ready", "cli:qa");
  saveVideo(video);
  log.ok(`QA passed → status preview_ready (${qaReportPath(videoId)})`);
}
