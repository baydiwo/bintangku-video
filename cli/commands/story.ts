import * as fs from "fs";
import * as path from "path";
import ora from "ora";
import { loadBudget, loadModels } from "../lib/config";
import { writeTextAtomic } from "../lib/atomic";
import { requireVideoId, loadVideo, ensureVideoDir } from "../lib/video-io";
import { videoDir } from "../lib/paths";
import {
  CliError,
  generateStoryDraft,
  getApiKey,
  getBalance,
} from "../providers/wavespeed";
import { assertBudgetAllows, estimateTtsCostUsd } from "../vo/budget";
import * as log from "../lib/log";

export async function cmdStory(
  videoIdArg: string,
  opts: { prompt: string },
): Promise<void> {
  const videoId = requireVideoId(videoIdArg);
  loadVideo(videoId); // ensure exists
  const models = loadModels();
  if (!models.story?.enabled) {
    throw new CliError(
      "ERR-STATE",
      "Story generator disabled in config/models.json (set story.enabled=true)",
    );
  }
  if (!opts.prompt?.trim()) {
    throw new CliError("ERR-SCHEMA", "--prompt required");
  }

  const budget = loadBudget();
  // story flat rate from budget rates if present; else 0.035
  const est =
    estimateTtsCostUsd(budget, models.story.model, 0) ||
    budget.rates.find((r) => r.model.includes("story"))?.priceUsd ||
    0.035;

  await assertBudgetAllows({
    budget,
    estimatedCostUsd: est,
  });
  void getApiKey;
  void getBalance;

  const spinner = ora("Generating story draft via WaveSpeed...").start();
  try {
    const { predictionId, text } = await generateStoryDraft({
      model: models.story.model,
      prompt: opts.prompt,
    });
    spinner.succeed("Story draft ready");

    ensureVideoDir(videoId);
    const drafts = path.join(videoDir(videoId), "drafts");
    fs.mkdirSync(drafts, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(drafts, `story-${stamp}.md`);
    writeTextAtomic(
      file,
      `# Story draft\n\nprompt: ${opts.prompt}\npredictionId: ${predictionId}\n\n---\n\n${text}\n`,
    );
    log.ok(`Wrote ${file} (does not modify video.json — edit into beats manually)`);
  } catch (err) {
    spinner.fail("Story failed");
    throw err;
  }
}
