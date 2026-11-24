/**
 * Character on-screen. Default visual = Explorer master PNG
 * (`brand/reference/mascot-explorer.png`) — the .svg is a PNG wrapper, not layered paths.
 * Geometric `ThinkerRig` remains available via visual="rig" (prototype only).
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThinkerRig } from "./ThinkerRig";
import {
  EXPRESSION_MOUTH,
  POSE_MAP,
  type MouthShape,
  type ThinkerExpression,
  type ThinkerPose,
} from "./types";

export type { MouthShape, ThinkerExpression, ThinkerPose };

export type ThinkerProps = {
  pose?: ThinkerPose;
  expression?: ThinkerExpression;
  mouth?: "auto" | MouthShape;
  mouthTrack?: Array<{ frame: number; shape: string }>;
  blink?: "auto" | "off" | "closed";
  bulb?: "off" | "dim" | "on";
  x?: number;
  y?: number;
  scale?: number;
  facing?: "left" | "right";
  motion?: "bounce" | "float" | "shake-soft" | "none";
  enter?: "pop" | "slide-left" | "fade" | "blur" | "none";
  exit?: "pop" | "slide-left" | "fade" | "blur" | "none";
  seed?: string;
  /** explorer = master PNG look; rig = geometric SVG prototype */
  visual?: "explorer" | "rig";
};

function mouthFromTrack(
  track: Array<{ frame: number; shape: string }> | undefined,
  localFrame: number,
): MouthShape | null {
  if (!track?.length) return null;
  let shape: MouthShape | null = null;
  for (const row of track) {
    if (row.frame <= localFrame) {
      shape = (row.shape as MouthShape) || "closed";
    } else break;
  }
  return shape;
}

function autoBlink(frame: number, fps: number, seed: string): boolean {
  const period = Math.round(fps * 2.4);
  const phase = Math.floor(random(`${seed}-blink`) * period);
  const t = (frame + phase) % period;
  return t < 3;
}

export const Thinker: React.FC<ThinkerProps> = ({
  pose = "idle",
  expression = "happy",
  mouth = "auto",
  mouthTrack,
  blink = "auto",
  bulb,
  x = 0.5,
  y = 0.62,
  scale = 1,
  facing = "right",
  motion = "float",
  enter = "pop",
  seed = "thinker",
  visual = "explorer",
  exit: _exit = "none",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  void _exit;

  const poseT = POSE_MAP[pose] ?? POSE_MAP.idle;

  const enterProgress =
    enter === "none"
      ? 1
      : spring({ frame, fps, config: { damping: 14, stiffness: 120 } });

  const floatY =
    motion === "float"
      ? Math.sin((frame / fps) * Math.PI * 1.2 + random(seed) * 6) * 10
      : motion === "bounce"
        ? Math.abs(Math.sin((frame / fps) * Math.PI * 2)) * -16
        : motion === "shake-soft"
          ? Math.sin(frame * 0.9) * 3
          : 0;

  const waveExtra =
    pose === "wave"
      ? interpolate(Math.sin(frame / 5), [-1, 1], [-8, 6])
      : 0;

  const poseTilt =
    pose === "cheer"
      ? -8
      : pose === "think"
        ? 6
        : pose === "wave"
          ? waveExtra * 0.4
          : 0;

  const trackMouth = mouthFromTrack(mouthTrack, frame);
  const mouthShape: MouthShape =
    mouth !== "auto"
      ? mouth
      : trackMouth ?? EXPRESSION_MOUTH[expression] ?? "smile";

  const isBlink =
    blink === "closed"
      ? true
      : blink === "off"
        ? false
        : autoBlink(frame, fps, seed);

  const bulbState = bulb ?? poseT.bulb ?? "dim";

  const mouthScaleY =
    mouthShape === "open"
      ? 1.4
      : mouthShape === "half"
        ? 1.15
        : mouthShape === "round"
          ? 1.3
          : 1;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x * width,
          top: y * height + floatY + poseT.bodyY,
          width: 520 * scale,
          height: 560 * scale,
          transform: `translate(-50%, -88%) scale(${enterProgress}) scaleX(${facing === "left" ? -1 : 1}) rotate(${poseTilt + poseT.headRot * 0.3}deg)`,
          transformOrigin: "50% 88%",
        }}
      >
        {visual === "rig" ? (
          <ThinkerRig
            mouth={mouthShape}
            blink={isBlink}
            bulb={bulbState}
            armLeftRot={poseT.armLeftRot}
            armRightRot={poseT.armRightRot + waveExtra}
            headRot={poseT.headRot}
            bodyY={0}
            treadsScaleX={poseT.treadsScaleX}
            showTablet
          />
        ) : (
          <>
            <Img
              src={staticFile("characters/explorer.png")}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            {/* Lip-sync proxy — flat art has no mouth layers */}
            <div
              style={{
                position: "absolute",
                left: "48%",
                top: "38%",
                width: "10%",
                height: `${4.5 * mouthScaleY}%`,
                borderRadius: mouthShape === "round" ? "50%" : 6,
                backgroundColor: "rgba(21, 41, 82, 0.65)",
                transform: "translate(-50%, 0)",
                opacity:
                  mouthShape === "closed" || mouthShape === "smile" ? 0 : 0.85,
              }}
            />
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
