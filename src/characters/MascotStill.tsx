/**
 * Still PNG maskot (Explorer / Dream Keeper) — tanpa mouthTrack (DEC-56).
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

const SRC: Record<string, string> = {
  explorer: "characters/explorer/default.png",
  "dream-keeper": "characters/dream-keeper/default.png",
  dreamkeeper: "characters/dream-keeper/default.png",
  thinker: "characters/thinker.png",
};

export type MascotStillProps = {
  character: string;
  x?: number;
  y?: number;
  scale?: number;
  facing?: "left" | "right";
  motion?: "bounce" | "float" | "none";
  enter?: "pop" | "fade" | "none";
  exit?: "pop" | "fade" | "none";
};

export const MascotStill: React.FC<MascotStillProps> = ({
  character,
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
  const key = character.toLowerCase();
  const path = SRC[key] ?? SRC.explorer!;

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
        ? Math.abs(Math.sin(frame / 6)) * 10
        : Math.sin(frame / 20) * 7;
  const flip = facing === "left" ? -1 : 1;
  const width = key.includes("dream") ? 480 : 560;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          transform: `translate(-50%, -50%) translateY(${-bob}px) scale(${visibility * scale * flip}, ${visibility * scale})`,
          transformOrigin: "center bottom",
          width,
          opacity: visibility,
        }}
      >
        <Img
          src={staticFile(path)}
          style={{ width: "100%", height: "auto", objectFit: "contain" }}
        />
      </div>
    </AbsoluteFill>
  );
};
