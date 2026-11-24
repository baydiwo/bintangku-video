export type ThinkerPose =
  | "idle"
  | "wave"
  | "think"
  | "cheer"
  | "point"
  | "calm"
  | "zoom";

export type ThinkerExpression =
  | "neutral"
  | "happy"
  | "excited"
  | "thinking"
  | "surprised"
  | "calm";

export type MouthShape = "closed" | "half" | "open" | "round" | "smile";

export type PoseTransforms = {
  armLeftRot: number;
  armRightRot: number;
  headRot: number;
  bodyY: number;
  treadsScaleX: number;
  bulb?: "off" | "dim" | "on";
};

/** Deterministic pose maps (TRD §07.3 / FR-CHR-004) */
export const POSE_MAP: Record<ThinkerPose, PoseTransforms> = {
  idle: {
    armLeftRot: 8,
    armRightRot: -8,
    headRot: 0,
    bodyY: 0,
    treadsScaleX: 1,
    bulb: "dim",
  },
  wave: {
    armLeftRot: 12,
    armRightRot: -55,
    headRot: -4,
    bodyY: -4,
    treadsScaleX: 1,
    bulb: "on",
  },
  think: {
    armLeftRot: 20,
    armRightRot: -35,
    headRot: 8,
    bodyY: 2,
    treadsScaleX: 1,
    bulb: "on",
  },
  cheer: {
    armLeftRot: -70,
    armRightRot: -70,
    headRot: -2,
    bodyY: -10,
    treadsScaleX: 1.02,
    bulb: "on",
  },
  point: {
    armLeftRot: 10,
    armRightRot: -40,
    headRot: -6,
    bodyY: 0,
    treadsScaleX: 1,
    bulb: "dim",
  },
  calm: {
    armLeftRot: 18,
    armRightRot: -18,
    headRot: 2,
    bodyY: 4,
    treadsScaleX: 1,
    bulb: "dim",
  },
  zoom: {
    armLeftRot: 5,
    armRightRot: -5,
    headRot: 0,
    bodyY: -6,
    treadsScaleX: 1.08,
    bulb: "on",
  },
};

export const EXPRESSION_MOUTH: Record<ThinkerExpression, MouthShape> = {
  neutral: "closed",
  happy: "smile",
  excited: "open",
  thinking: "closed",
  surprised: "round",
  calm: "smile",
};
