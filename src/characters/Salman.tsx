/**
 * Salman — anak surrogate (character sheet crop, bukan maskot brand).
 * Pose dari `public/characters/salman/<pose>.png`.
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const POSE_FILES: Record<string, string> = {
  stand: "stand",
  idle: "stand",
  "stand-34": "stand-34",
  side: "side",
  cheer: "cheer",
  proud: "cheer",
  confident: "cheer",
  topdown: "topdown",
  straps: "straps",
  scared: "straps",
  surprised: "straps",
  worried: "straps",
  huddle: "straps",
  closeup: "closeup",
  "brush-front": "closeup",
  "brush-tongue": "closeup",
  back: "back",
  "stand-alt": "stand-alt",
  "sleepy-yawn": "stand",
  sit: "stand",
  dismissive: "stand-34",
  "brush-prep": "stand",
  "brush-side": "side",
  rinse: "stand-34",
  smile: "stand",
  point: "stand-34",
  offer: "stand",
  default: "default",
};

export type SalmanProps = {
  pose?: string;
  x?: number;
  y?: number;
  scale?: number;
  facing?: "left" | "right";
  motion?: "bounce" | "float" | "shake-soft" | "none";
  enter?: "pop" | "slide-left" | "fade" | "none";
  exit?: "pop" | "slide-left" | "fade" | "none";
};

export const Salman: React.FC<SalmanProps> = ({
  pose = "stand",
  x = 0.5,
  y = 0.62,
  scale = 1,
  facing = "right",
  motion = "float",
  enter = "pop",
  exit = "none",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const file = POSE_FILES[pose] ?? POSE_FILES.default ?? "stand";
  const src = staticFile(`characters/salman/${file}.png`);

  const enterProg =
    enter === "none"
      ? 1
      : spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const exitStart = Math.max(0, durationInFrames - 8);
  const exitProg =
    exit === "none"
      ? 1
      : interpolate(frame, [exitStart, durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const visibility = enterProg * exitProg;

  const bob =
    motion === "none"
      ? 0
      : motion === "bounce"
        ? Math.abs(Math.sin(frame / 6)) * 12
        : Math.sin(frame / 18) * 8;

  const flip = facing === "left" ? -1 : 1;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          transform: `translate(-50%, -50%) translateY(${-bob}px) scale(${visibility * scale * flip}, ${visibility * scale})`,
          transformOrigin: "center bottom",
          width: 520,
          opacity: visibility,
        }}
      >
        <Img
          src={src}
          style={{ width: "100%", height: "auto", objectFit: "contain" }}
        />
      </div>
    </AbsoluteFill>
  );
};
