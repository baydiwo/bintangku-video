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

export type VideoDoc = {
  schemaVersion: string;
  id: string;
  version: number;
  title: string;
  pillar?: string;
  language: string;
  targetDuration: 30 | 60;
  voiceOverride?: Record<string, unknown>;
  beats: Beat[];
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

export type VoManifest = {
  videoId: string;
  beats: VoManifestBeat[];
};

export type CaptionWord = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number;
  confidence: number | null;
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
    generatedAt: string;
    generator: string;
    rigVersion: string;
    remotionVersion: string;
  };
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
    beatId: string;
    frames: Array<{ frame: number; shape: string }>;
  }>;
  approvalHash: string;
};
