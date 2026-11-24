import { requireVideoId } from "../lib/video-io";
import { requireStoryboardApproved } from "../lib/storyboard";
import { cmdValidate } from "./validate";
import { cmdVo } from "./vo";
import { cmdTimeline } from "./timeline";
import { cmdQa } from "./qa";
import * as log from "../lib/log";

export async function cmdGen(
  videoIdArg: string,
  opts: { dryRun?: boolean; voiceId?: string },
): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  requireStoryboardApproved(videoId);
  log.info(`gen ${videoId}: validate → vo → timeline → qa`);
  await cmdValidate(videoId);
  await cmdVo(videoId, { dryRun: opts.dryRun, voiceId: opts.voiceId });
  if (opts.dryRun) {
    log.ok("gen dry-run stopped after vo estimate");
    return;
  }
  await cmdTimeline(videoId);
  await cmdQa(videoId, {});
  log.ok("gen complete — status should be preview_ready. Run review, then approve (user).");
}
