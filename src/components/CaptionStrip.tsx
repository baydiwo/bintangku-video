import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";

const { fontFamily } = loadFredoka();

type CaptionWord = {
  text: string;
  startMs: number;
  endMs: number;
};

export const CaptionStrip: React.FC<{
  captions: CaptionWord[];
  /** Absolute frame offset where this caption block starts (usually 0 for absolute ms) */
}> = ({ captions }) => {
  const frame = useCurrentFrame();
  const nowMs = (frame / 30) * 1000;

  const active = captions.filter(
    (c) => c.startMs <= nowMs && nowMs < c.endMs,
  );
  if (!active.length) return null;

  const line = active.map((c) => c.text).join(" ");

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 720,
        paddingLeft: 80,
        paddingRight: 80,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.2,
          color: "#f5f4f0",
          textAlign: "center",
          textShadow: "0 2px 0 #0d1b4b, 0 4px 16px rgba(0,0,0,0.45)",
          maxWidth: "90%",
        }}
      >
        {line}
      </div>
    </AbsoluteFill>
  );
};
