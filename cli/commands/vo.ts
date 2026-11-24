import ora from "ora";
import {
  loadVideo,
  requireVideoId,
  saveVideo,
  transitionStatus,
} from "../lib/video-io";
import { validateVideoDoc } from "../lib/validate-schema";
import { requireStoryboardApproved } from "../lib/storyboard";
import { generateVoiceovers } from "../vo/generate";
import * as log from "../lib/log";
import { writeRunLog } from "../lib/log";

export async function cmdVo(
  videoIdArg: string,
  opts: { dryRun?: boolean; voiceId?: string },
): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  requireStoryboardApproved(videoId);
  let video = loadVideo(videoId);
  validateVideoDoc(video);

  const spinner = ora(
    opts.dryRun ? "Estimating VO cost..." : "Generating VO via WaveSpeed...",
  ).start();

  try {
    const result = await generateVoiceovers(video, {
      dryRun: opts.dryRun,
      voiceIdOverride: opts.voiceId,
    });

    spinner.stop();

    log.info(
      `Beats: ${result.cached.length} cache hit, ${result.generated.length} to generate`,
    );
    log.info(`Estimated cost: $${result.estimatedCostUsd.toFixed(4)}`);
    if (typeof result.balance === "number") {
      log.info(`Balance: $${result.balance.toFixed(4)}`);
    }

    if (opts.dryRun) {
      log.ok("Dry-run complete (no WaveSpeed submit)");
      return;
    }

    if (!opts.dryRun) {
      video = transitionStatus(video, "vo_ready", "cli:vo");
      saveVideo(video);
      log.ok(
        `VO ready — generated [${result.generated.join(", ") || "—"}] cached [${result.cached.join(", ") || "—"}]`,
      );
      writeRunLog(videoId, "vo", [
        `generated=${result.generated.join(",")}`,
        `cached=${result.cached.join(",")}`,
        `spentUsd=${result.spentUsd}`,
      ]);
    }
  } catch (err) {
    spinner.fail("VO failed");
    throw err;
  }
}
