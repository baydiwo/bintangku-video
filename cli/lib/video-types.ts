export type VideoStatus =
  | "draft"
  | "vo_ready"
  | "preview_ready"
  | "in_review"
  | "moderation_flagged"
  | "changes_requested"
  | "approved"
  | "rendering"
  | "rendered"
  | "archived";

export type Shot = {
  character?: Record<string, unknown> | null;
  background: Record<string, unknown>;
  ornaments?: unknown[];
  onScreenText?: Record<string, unknown>;
  sfx?: unknown[];
  aiClip?: Record<string, unknown>;
};

export type Beat = {
  id: string;
  text: string;
  speech?: string;
  /** OQ-32 / DEC-45 — default spoken; max 1 sung per video */
  delivery?: "spoken" | "sung";
  minSlots?: number;
  slots?: number;
  shots: Shot[];
};

/** Scene-first (DEC-57) — 1 scene = 1 unit storyboard + 1 VO file */
export type SceneCast = {
  character: string;
  pose?: string;
  expression?: string;
  x?: number;
  y?: number;
};

export type Scene = {
  id: string;
  beatId: string;
  voText: string;
  speech?: string;
  durationHintSec?: number;
  delivery?: "spoken" | "sung";
  cast?: SceneCast[];
  action?: string;
  background?: Record<string, unknown>;
  ornaments?: unknown[];
  sfx?: unknown[];
  captionStep?: string | null;
  camera?: string;
};

export type VideoDoc = {
  schemaVersion: string;
  id: string;
  version: number;
  title: string;
  pillar?: string;
  topic?: string;
  format?: "kids-story" | "legacy";
  language: string;
  targetDuration: 30 | 60;
  pacing?: "scene" | "grid";
  voiceOverride?: Record<string, unknown>;
  cast?: Array<{ role: string; character: string }>;
  scenes?: Scene[];
  jingle?: {
    durationSec?: number;
    lines?: Array<{ lyric: string; caption?: string }>;
  };
  endCard?: { tagline?: string; method?: string[] };
  /** Legacy grid beats — unused when pacing=scene */
  beats?: Beat[];
  captions?: { enabled?: boolean };
  status: VideoStatus;
  reviewNotes?: Array<{
    slot?: number;
    note: string;
    at: string;
    by: string;
  }>;
  approval?: {
    by: string;
    at: string;
    approvalHash: string;
    checklist?: Record<string, boolean>;
  } | null;
  history: Array<{ from: string; to: string; at: string; by: string }>;
};

export type VoManifestBeat = {
  beatId: string;
  cacheKey: string;
  file: string;
  fileSha256: string;
  alignmentFile: string;
  alignmentSource: "tts" | "stt" | "local" | "proportional";
  envelopeFile: string;
  durationSec: number;
  characters: number;
  model: string;
  predictionId: string | null;
  estimatedCostUsd: number;
  createdAt: string;
};

export type VoManifestScene = {
  sceneId: string;
  beatId: string;
  cacheKey: string;
  file: string;
  fileSha256: string;
  alignmentFile: string;
  alignmentSource: "tts" | "stt" | "local" | "proportional";
  envelopeFile: string;
  durationSec: number;
  characters: number;
  model: string;
  predictionId: string | null;
  estimatedCostUsd: number;
  createdAt: string;
};

export type VoManifest = {
  videoId: string;
  beats?: VoManifestBeat[];
  scenes?: VoManifestScene[];
};

export type CaptionWord = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number;
  confidence: number | null;
};

export type TimelineScene = {
  id: string;
  beatId: string;
  from: number;
  durationInFrames: number;
};

export type TimelineDoc = {
  meta: {
    videoId: string;
    version: number;
    fps: number;
    slotFrames: number;
    totalSlots: number;
    durationInFrames: number;
    width: number;
    height: number;
    pacing?: "scene" | "grid";
    generatedAt: string;
    generator: string;
    rigVersion: string;
    remotionVersion: string;
  };
  /** Scene-first sequences (DEC-57) */
  scenes?: TimelineScene[];
  /** Legacy grid slots */
  slots: Array<{
    index: number;
    beatId: string;
    from: number;
    durationInFrames: number;
  }>;
  elements: unknown[];
  text: unknown[];
  audio: unknown[];
  mouthTracks: Array<{
    beatId?: string;
    sceneId?: string;
    frames: Array<{ frame: number; shape: string }>;
  }>;
  approvalHash: string;
};
