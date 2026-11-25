import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const EndCard: React.FC<{
  tagline?: string;
  method?: string[];
}> = ({
  tagline = "Langkah Kecil Menuju Anak Mandiri",
  method = ["Kebiasaan", "Mandiri", "Rutin malam"],
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const drift = Math.sin(frame / 25) * 6;

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #1a2a6c 0%, #0d1b4b 55%, #070e28 100%)",
        opacity,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Fredoka, Nunito Sans, sans-serif",
        color: "#f5f4f0",
        padding: 80,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: 1,
          transform: `translateY(${drift}px)`,
        }}
      >
        Bintangku.app
      </div>
      <div style={{ marginTop: 28, fontSize: 40, maxWidth: 820, lineHeight: 1.25 }}>
        {tagline}
      </div>
      <div
        style={{
          marginTop: 48,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {method.map((m) => (
          <span
            key={m}
            style={{
              border: "2px solid rgba(245,244,240,0.35)",
              borderRadius: 999,
              padding: "10px 22px",
              fontSize: 28,
            }}
          >
            {m}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
