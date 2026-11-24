#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { loadEnv } from "./lib/env";
import { CliError } from "./providers/wavespeed/types";
import * as log from "./lib/log";
import { cmdNew } from "./commands/new";
import { cmdValidate } from "./commands/validate";
import { cmdVo } from "./commands/vo";
import { cmdTimeline } from "./commands/timeline";
import { cmdQa } from "./commands/qa";
import { cmdReview } from "./commands/review";
import { cmdApprove } from "./commands/approve";
import { cmdRequestChanges } from "./commands/request-changes";
import { cmdDraft, cmdRender } from "./commands/render";
import { cmdGen } from "./commands/gen";
import { cmdStory } from "./commands/story";
import { cmdBalance } from "./commands/balance";
import { cmdHandoff } from "./commands/handoff";

loadEnv();

async function run(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    if (err instanceof CliError) {
      log.fail(err.message);
      process.exit(1);
    }
    log.fail(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

yargs(hideBin(process.argv))
  .scriptName("studio")
  .command(
    "new",
    "Create videos/<YYYYMMDD-slug>/video.json",
    (y) =>
      y
        .option("slug", { type: "string", demandOption: true })
        .option("date", { type: "string", describe: "YYYYMMDD" })
        .option("title", { type: "string" })
        .option("duration", {
          type: "number",
          choices: [30, 60],
          default: 30,
        }),
    (argv) =>
      run(() =>
        cmdNew({
          slug: argv.slug,
          date: argv.date,
          title: argv.title,
          targetDuration: argv.duration as 30 | 60,
        }),
      ),
  )
  .command(
    "validate <videoId>",
    "Validate video.json schema",
    (y) => y.positional("videoId", { type: "string", demandOption: true }),
    (argv) => run(() => cmdValidate(String(argv.videoId))),
  )
  .command(
    "vo <videoId>",
    "Generate VO per beat via WaveSpeed TTS",
    (y) =>
      y
        .positional("videoId", { type: "string", demandOption: true })
        .option("dry-run", { type: "boolean", default: false })
        .option("voice-id", { type: "string" }),
    (argv) =>
      run(() =>
        cmdVo(String(argv.videoId), {
          dryRun: argv["dry-run"],
          voiceId: argv["voice-id"],
        }),
      ),
  )
  .command(
    "timeline <videoId>",
    "Build timeline.json from video.json + VO",
    (y) => y.positional("videoId", { type: "string", demandOption: true }),
    (argv) => run(() => cmdTimeline(String(argv.videoId))),
  )
  .command(
    "qa <videoId>",
    "Run automated QA checks",
    (y) =>
      y
        .positional("videoId", { type: "string", demandOption: true })
        .option("moderate", { type: "boolean", default: false }),
    (argv) =>
      run(() =>
        cmdQa(String(argv.videoId), { moderate: argv.moderate }),
      ),
  )
  .command(
    "review <videoId>",
    "Mark video in_review for user preview",
    (y) => y.positional("videoId", { type: "string", demandOption: true }),
    (argv) => run(() => cmdReview(String(argv.videoId))),
  )
  .command(
    "approve <videoId>",
    "User-only approval (hash guard)",
    (y) => y.positional("videoId", { type: "string", demandOption: true }),
    (argv) => run(() => cmdApprove(String(argv.videoId))),
  )
  .command(
    "request-changes <videoId>",
    "Request revisions",
    (y) =>
      y
        .positional("videoId", { type: "string", demandOption: true })
        .option("slot", { type: "number" })
        .option("note", { type: "string", demandOption: true }),
    (argv) =>
      run(() =>
        cmdRequestChanges(String(argv.videoId), {
          slot: argv.slot,
          note: String(argv.note),
        }),
      ),
  )
  .command(
    "draft <videoId>",
    "Render low-res DRAFT MP4",
    (y) => y.positional("videoId", { type: "string", demandOption: true }),
    (argv) => run(() => cmdDraft(String(argv.videoId))),
  )
  .command(
    "render <videoId>",
    "Render final MP4 (requires approved + matching hash)",
    (y) =>
      y
        .positional("videoId", { type: "string", demandOption: true })
        .option("target", {
          type: "string",
          choices: ["local", "lambda"],
          default: "local",
        }),
    (argv) =>
      run(() =>
        cmdRender(String(argv.videoId), {
          target: argv.target as "local" | "lambda",
        }),
      ),
  )
  .command(
    "gen <videoId>",
    "validate → vo → timeline → qa",
    (y) =>
      y
        .positional("videoId", { type: "string", demandOption: true })
        .option("dry-run", { type: "boolean", default: false })
        .option("voice-id", { type: "string" }),
    (argv) =>
      run(() =>
        cmdGen(String(argv.videoId), {
          dryRun: argv["dry-run"],
          voiceId: argv["voice-id"],
        }),
      ),
  )
  .command(
    "story <videoId>",
    "Optional AI story draft (does not write video.json)",
    (y) =>
      y
        .positional("videoId", { type: "string", demandOption: true })
        .option("prompt", { type: "string", demandOption: true }),
    (argv) =>
      run(() =>
        cmdStory(String(argv.videoId), { prompt: String(argv.prompt) }),
      ),
  )
  .command(
    "balance",
    "Show WaveSpeed account balance",
    () => undefined,
    () => run(() => cmdBalance()),
  )
  .command(
    "handoff <videoId>",
    "Build local handoff package (+ Drive when auth ready)",
    (y) =>
      y
        .positional("videoId", { type: "string", demandOption: true })
        .option("no-upload", { type: "boolean", default: false }),
    (argv) =>
      run(() =>
        cmdHandoff(String(argv.videoId), {
          noUpload: argv["no-upload"],
        }),
      ),
  )
  .demandCommand(1)
  .strict()
  .help()
  .alias("h", "help")
  .parse();
