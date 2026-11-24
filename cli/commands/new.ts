import { writeJsonAtomic } from "../lib/atomic";
import { ensureVideoDir, requireVideoId } from "../lib/video-io";
import type { VideoDoc } from "../lib/video-types";
import { CliError } from "../providers/wavespeed/types";
import * as fs from "fs";
import * as path from "path";
import { rootDir, storyboardPath, videoJsonPath } from "../lib/paths";
import * as log from "../lib/log";

export async function cmdNew(opts: {
  slug: string;
  date?: string;
  title?: string;
  targetDuration?: 30 | 60;
}): Promise<void> {
  const date =
    opts.date ??
    new Date().toISOString().slice(0, 10).replace(/-/g, "");
  if (!/^\d{8}$/.test(date)) {
    throw new CliError("ERR-SCHEMA", `--date must be YYYYMMDD`);
  }
  const slug = opts.slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) throw new CliError("ERR-SCHEMA", "slug required");

  const id = requireVideoId(`${date}-${slug}`);
  if (fs.existsSync(videoJsonPath(id))) {
    throw new CliError("ERR-ID-EXISTS", `videos/${id} already exists`);
  }

  ensureVideoDir(id);
  const video: VideoDoc = {
    schemaVersion: "1.0.0",
    id,
    version: 1,
    title: opts.title ?? slug.replace(/-/g, " "),
    language: "id",
    targetDuration: opts.targetDuration ?? 30,
    beats: [
      {
        id: "b01",
        text: "Halo! Aku Thinker.",
        minSlots: 1,
        shots: [
          {
            character: {
              pose: "wave",
              expression: "happy",
              x: 0.5,
              y: 0.62,
            },
            background: { type: "cosmic-flat", palette: "navy" },
            ornaments: [
              {
                type: "star",
                color: "brand.starYellow",
                x: 0.2,
                y: 0.2,
              },
            ],
          },
        ],
      },
    ],
    captions: { enabled: true },
    status: "draft",
    history: [
      {
        from: "draft",
        to: "draft",
        at: new Date().toISOString(),
        by: "cli:new",
      },
    ],
  };

  writeJsonAtomic(videoJsonPath(id), video);

  const template = path.join(rootDir(), "videos", "_template", "storyboard.md");
  const destBoard = storyboardPath(id);
  if (fs.existsSync(template)) {
    const body = fs
      .readFileSync(template, "utf8")
      .replace(/`<videoId>`/g, id)
      .replace(
        "- Status: `storyboard_draft` | `storyboard_in_review` | `storyboard_approved`",
        "- Status: `storyboard_draft`",
      );
    fs.writeFileSync(destBoard, body, "utf8");
  } else {
    fs.writeFileSync(
      destBoard,
      `# Storyboard — ${id}\n\n- Status: \`storyboard_draft\`\n`,
      "utf8",
    );
  }

  log.ok(`Created videos/${id}/video.json + storyboard.md (draft)`);
  log.info("Approve storyboard (Status: storyboard_approved) before vo/gen.");
}
