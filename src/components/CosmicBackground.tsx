import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";

const PALETTES: Record<string, { bg: string; star: string; glow: string }> = {
  navy: { bg: "#0d1b4b", star: "#ffd234", glow: "#1a2f7a" },
  cosmic: { bg: "#08122f", star: "#ffb800", glow: "#5BC8F5" },
  "night-warm": { bg: "#1a1538", star: "#ffc857", glow: "#3d2a6b" },
  "pastel-cosmic": { bg: "#2a1f4d", star: "#ffe08a", glow: "#6b5b95" },
  brand: { bg: "#0d1b4b", star: "#ffd234", glow: "#1a2f7a" },
};

export const CosmicBackground: React.FC<{
  type?: string;
  palette?: string;
  seed?: string;
}> = ({ type = "cosmic-flat", palette = "navy", seed = "bg" }) => {
  const frame = useCurrentFrame();
  const colors = PALETTES[palette] ?? PALETTES.navy;
  const stars = Array.from({ length: 36 }, (_, i) => {
    const rx = random(`${seed}-x-${i}`);
    const ry = random(`${seed}-y-${i}`);
    const size = 2 + random(`${seed}-s-${i}`) * 4;
    const twinkle =
      0.35 +
      0.65 *
        (0.5 +
          0.5 * Math.sin(frame * 0.08 + random(`${seed}-t-${i}`) * 20));
    return { rx, ry, size, twinkle };
  });

  return (
    <AbsoluteFill
      style={{
        background:
          type === "gradient"
            ? `radial-gradient(ellipse at 50% 30%, ${colors.glow} 0%, ${colors.bg} 70%)`
            : colors.bg,
      }}
    >
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.rx * 100}%`,
            top: `${s.ry * 100}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            backgroundColor: colors.star,
            opacity: s.twinkle,
            boxShadow: `0 0 ${s.size * 2}px ${colors.star}`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
