import * as path from "path";

export const rootDir = () => process.cwd();

export const videosDir = () => path.join(rootDir(), "videos");
export const configDir = () => path.join(rootDir(), "config");
export const schemasDir = () => path.join(rootDir(), "schemas");
export const publicVoiceoverDir = (videoId: string) =>
  path.join(rootDir(), "public", "voiceover", videoId);
export const rendersDir = () => path.join(rootDir(), "renders");

export const videoDir = (videoId: string) =>
  path.join(videosDir(), videoId);

export const videoJsonPath = (videoId: string) =>
  path.join(videoDir(videoId), "video.json");

export const timelineJsonPath = (videoId: string) =>
  path.join(videoDir(videoId), "timeline.json");

export const storyboardPath = (videoId: string) =>
  path.join(videoDir(videoId), "storyboard.md");

export const publicTimelinePath = (videoId: string) =>
  path.join(rootDir(), "public", "timelines", `${videoId}.json`);

export const qaReportPath = (videoId: string) =>
  path.join(videoDir(videoId), "qa-report.json");

export const videoLogsDir = (videoId: string) =>
  path.join(videoDir(videoId), "logs");

export const beatMp3Path = (videoId: string, beatId: string) =>
  path.join(publicVoiceoverDir(videoId), `${beatId}.mp3`);

export const beatAlignmentPath = (videoId: string, beatId: string) =>
  path.join(publicVoiceoverDir(videoId), `${beatId}.alignment.json`);

export const beatEnvelopePath = (videoId: string, beatId: string) =>
  path.join(publicVoiceoverDir(videoId), `${beatId}.envelope.json`);

/** Scene-first VO paths (DEC-57) — same folder, keyed by S01… */
export const sceneMp3Path = (videoId: string, sceneId: string) =>
  path.join(publicVoiceoverDir(videoId), `${sceneId}.mp3`);

export const sceneAlignmentPath = (videoId: string, sceneId: string) =>
  path.join(publicVoiceoverDir(videoId), `${sceneId}.alignment.json`);

export const sceneEnvelopePath = (videoId: string, sceneId: string) =>
  path.join(publicVoiceoverDir(videoId), `${sceneId}.envelope.json`);

export const voManifestPath = (videoId: string) =>
  path.join(publicVoiceoverDir(videoId), "manifest.json");
