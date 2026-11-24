import * as fs from "fs";
import { writeJsonAtomic, readJson } from "./atomic";
import { videoJsonPath, timelineJsonPath, videoDir } from "./paths";
import type { VideoDoc, VideoStatus } from "./video-types";
import { CliError } from "../providers/wavespeed/types";

export function requireVideoId(videoId: string | undefined): string {
  if (!videoId || !/^\d{8}-[a-z0-9-]+$/.test(videoId)) {
    throw new CliError(
      "ERR-SCHEMA",
      `Invalid videoId "${videoId ?? ""}". Expected YYYYMMDD-slug`,
    );
  }
  return videoId;
}

export function loadVideo(videoId: string): VideoDoc {
  const p = videoJsonPath(videoId);
  if (!fs.existsSync(p)) {
    throw new CliError("ERR-ASSET-MISSING", `Missing ${p}`);
  }
  return readJson<VideoDoc>(p);
}

export function saveVideo(video: VideoDoc): void {
  writeJsonAtomic(videoJsonPath(video.id), video);
}

export function ensureVideoDir(videoId: string): void {
  fs.mkdirSync(videoDir(videoId), { recursive: true });
  fs.mkdirSync(`${videoDir(videoId)}/logs`, { recursive: true });
}

export function transitionStatus(
  video: VideoDoc,
  to: VideoStatus,
  by: string,
): VideoDoc {
  const from = video.status;
  const at = new Date().toISOString();
  return {
    ...video,
    status: to,
    history: [...(video.history ?? []), { from, to, at, by }],
  };
}

export function loadTimelineIfExists(videoId: string) {
  const p = timelineJsonPath(videoId);
  if (!fs.existsSync(p)) return null;
  return readJson(p);
}
