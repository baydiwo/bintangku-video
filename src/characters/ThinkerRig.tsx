/**
 * Layered Thinker SVG (TRD §07.2). Colors from brand/tokens.json mascot.* only.
 * Redrawn to match brand/reference/thinker.png — not auto-traced (DEC-13).
 */
import React from "react";
import { mascot } from "../lib/tokens";
import type { MouthShape } from "./types";

const C = mascot;
const SW = 5;

/** Fixed 5-point star (no Math in render path) */
const STAR5 =
  "0,-10 2.4,-3.1 10,-3.1 3.8,1.9 6.2,9 -0,4.5 -6.2,9 -3.8,1.9 -10,-3.1 -2.4,-3.1";

function Star({
  cx,
  cy,
  r = 10,
  fill = C.hubYellow,
}: {
  cx: number;
  cy: number;
  r?: number;
  fill?: string;
}) {
  return (
    <polygon
      points={STAR5}
      fill={fill}
      stroke={C.outline}
      strokeWidth={1.5}
      transform={`translate(${cx} ${cy}) scale(${r / 10})`}
    />
  );
}

export type ThinkerRigProps = {
  mouth: MouthShape;
  blink: boolean;
  bulb: "off" | "dim" | "on";
  armLeftRot?: number;
  armRightRot?: number;
  headRot?: number;
  bodyY?: number;
  treadsScaleX?: number;
  showTablet?: boolean;
};

export const ThinkerRig: React.FC<ThinkerRigProps> = ({
  mouth,
  blink,
  bulb,
  armLeftRot = 0,
  armRightRot = 0,
  headRot = 0,
  bodyY = 0,
  treadsScaleX = 1,
  showTablet = true,
}) => {
  const bulbOpacity = bulb === "on" ? 1 : bulb === "dim" ? 0.55 : 0.2;
  const glowOpacity = bulb === "on" ? 0.5 : bulb === "dim" ? 0.22 : 0;

  return (
    <svg
      viewBox="0 0 400 520"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      data-rig="thinker"
      data-version="0.1.0"
      style={{ overflow: "visible" }}
    >
      {/* treads */}
      <g id="treads" transform={`translate(200 490) scale(${treadsScaleX} 1)`}>
        <ellipse cx="0" cy="10" rx="95" ry="9" fill="#000" opacity="0.2" />
        <path
          d="M-98 -4 C-98 -20 -78 -30 -52 -30 L52 -30 C78 -30 98 -20 98 -4
             L100 12 C100 26 72 32 0 32 C-72 32 -100 26 -100 12 Z"
          fill={C.tread}
          stroke={C.outline}
          strokeWidth={SW}
        />
        {[
          [-52, 0],
          [-18, 2],
          [18, 2],
          [52, 0],
        ].map(([cx, cy], i) => (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <circle r="17" fill={C.earBlue} stroke={C.outline} strokeWidth={3} />
            <circle r="7.5" fill={C.hubYellow} stroke={C.outline} strokeWidth={2} />
          </g>
        ))}
        {[-78, -52, -26, 0, 26, 52, 78].map((x) => (
          <rect
            key={x}
            x={x - 5}
            y={-28}
            width="10"
            height="7"
            rx="2"
            fill={C.navy}
          />
        ))}
      </g>

      {/* body */}
      <g id="body" transform={`translate(200 ${368 + bodyY})`}>
        <path
          d="M-52 -62 C-52 -82 -34 -94 0 -94 C34 -94 52 -82 52 -62
             L56 48 C56 70 36 86 0 86 C-36 86 -56 70 -56 48 Z"
          fill={C.white}
          stroke={C.outline}
          strokeWidth={SW}
        />
        <rect
          x="-32"
          y="-28"
          width="64"
          height="50"
          rx="12"
          fill={C.earBlue}
          stroke={C.outline}
          strokeWidth={3}
        />
        <Star cx={0} cy={-2} r={11} />
        <Star cx={-18} cy={20} r={6} fill={C.bulb} />
        <Star cx={18} cy={20} r={6} fill={C.bulb} />
      </g>

      {/* arm left */}
      <g
        id="arm-left"
        transform={`translate(132 ${330 + bodyY}) rotate(${armLeftRot})`}
      >
        <rect
          x="-13"
          y="0"
          width="26"
          height="54"
          rx="13"
          fill={C.white}
          stroke={C.outline}
          strokeWidth={SW - 1}
        />
        <circle cy="58" r="15" fill={C.earBlue} stroke={C.outline} strokeWidth={3} />
        {[-9, 0, 9].map((dx) => (
          <rect
            key={dx}
            x={dx - 3.5}
            y="68"
            width="7"
            height="14"
            rx="3.5"
            fill={C.earBlue}
            stroke={C.outline}
            strokeWidth={2}
          />
        ))}
      </g>

      {/* arm right + tablet */}
      <g
        id="arm-right"
        transform={`translate(268 ${330 + bodyY}) rotate(${armRightRot})`}
      >
        <rect
          x="-13"
          y="0"
          width="26"
          height="48"
          rx="13"
          fill={C.white}
          stroke={C.outline}
          strokeWidth={SW - 1}
        />
        <circle cy="52" r="15" fill={C.earBlue} stroke={C.outline} strokeWidth={3} />
        {[-9, 0, 9].map((dx) => (
          <rect
            key={dx}
            x={dx - 3.5}
            y="62"
            width="7"
            height="12"
            rx="3.5"
            fill={C.earBlue}
            stroke={C.outline}
            strokeWidth={2}
          />
        ))}
        {showTablet ? (
          <g id="tablet" transform="translate(30 36) rotate(-14)">
            <rect
              x="-26"
              y="-36"
              width="52"
              height="72"
              rx="9"
              fill={C.blue}
              stroke={C.outline}
              strokeWidth={3}
              opacity={0.95}
            />
            <rect
              x="-18"
              y="-26"
              width="36"
              height="52"
              rx="5"
              fill={C.white}
              opacity={0.32}
            />
            <circle cx="-6" cy="-8" r="2.2" fill={C.white} />
            <circle cx="8" cy="0" r="2.2" fill={C.white} />
            <circle cx="0" cy="12" r="2.2" fill={C.white} />
            <path
              d="M-6 -8 L8 0 L0 12"
              stroke={C.white}
              strokeWidth="1.5"
              fill="none"
              opacity="0.85"
            />
            <Star cx={10} cy={22} r={5.5} fill={C.white} />
          </g>
        ) : null}
      </g>

      {/* head */}
      <g
        id="head"
        transform={`translate(200 ${188 + bodyY * 0.35}) rotate(${headRot})`}
      >
        <g id="ear-left" transform="translate(-92 8)">
          <ellipse
            rx="30"
            ry="36"
            fill={C.earBlue}
            stroke={C.outline}
            strokeWidth={SW - 1}
          />
          <Star cx={0} cy={2} r={12} />
        </g>
        <g id="ear-right" transform="translate(92 8)">
          <ellipse
            rx="30"
            ry="36"
            fill={C.earBlue}
            stroke={C.outline}
            strokeWidth={SW - 1}
          />
          <Star cx={0} cy={2} r={12} />
        </g>

        {/* head shell — slightly squarer like PNG */}
        <path
          d="M-82 -28 C-82 -88 -50 -112 0 -112 C50 -112 82 -88 82 -28
             L84 58 C84 100 50 122 0 122 C-50 122 -84 100 -84 58 Z"
          fill={C.white}
          stroke={C.outline}
          strokeWidth={SW}
        />

        <g id="antenna-left" transform="translate(-26 -106)">
          <line
            x1="0"
            y1="10"
            x2="-8"
            y2="-16"
            stroke={C.outline}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="-8" cy="-20" r="4" fill={C.navy} />
        </g>
        <g id="antenna-right" transform="translate(26 -106)">
          <line
            x1="0"
            y1="10"
            x2="8"
            y2="-16"
            stroke={C.outline}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="8" cy="-20" r="4" fill={C.navy} />
        </g>

        <g id="antenna" transform="translate(0 -114)">
          <line
            x1="0"
            y1="22"
            x2="0"
            y2="-6"
            stroke={C.outline}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <g id="bulb-glow" opacity={glowOpacity}>
            <polygon
              points="0,-58 14,-30 44,-34 22,-10 34,20 0,4 -34,20 -22,-10 -44,-34 -14,-30"
              fill={C.bulb}
              opacity="0.5"
            />
          </g>
          <g id="bulb" opacity={bulbOpacity}>
            <ellipse
              cy="-30"
              rx="24"
              ry="28"
              fill={C.bulb}
              stroke={C.outline}
              strokeWidth={SW - 1}
            />
            <rect
              x="-11"
              y="-6"
              width="22"
              height="15"
              rx="3"
              fill={C.hubYellow}
              stroke={C.outline}
              strokeWidth="2"
            />
            <path
              d="M-9 -42 Q0 -52 9 -42"
              stroke={C.white}
              strokeWidth="3"
              fill="none"
              opacity="0.75"
            />
          </g>
        </g>

        <g id="visor">
          <ellipse
            cx="0"
            cy="20"
            rx="60"
            ry="50"
            fill={C.visor}
            stroke={C.outline}
            strokeWidth={3}
          />
          <ellipse
            cx="-18"
            cy="2"
            rx="20"
            ry="11"
            fill={C.white}
            opacity="0.2"
          />
        </g>

        <g id="eye-left" transform="translate(-24 14)">
          <circle r="17" fill={C.blue} />
          <circle cx="5" cy="-5" r="5.5" fill={C.white} />
        </g>
        <g id="eye-right" transform="translate(24 14)">
          <circle r="17" fill={C.blue} />
          <circle cx="5" cy="-5" r="5.5" fill={C.white} />
        </g>

        <g id="eyelids" opacity={blink ? 1 : 0}>
          <path
            d="M-40 6 Q-24 -10 -8 6"
            stroke={C.visor}
            strokeWidth="15"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M8 6 Q24 -10 40 6"
            stroke={C.visor}
            strokeWidth="15"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        <ellipse cx="-42" cy="40" rx="11" ry="8" fill={C.cheek} opacity="0.95" />
        <ellipse cx="42" cy="40" rx="11" ry="8" fill={C.cheek} opacity="0.95" />

        <g id="mouth-closed" opacity={mouth === "closed" ? 1 : 0}>
          <path
            d="M-14 56 Q0 62 14 56"
            stroke={C.blue}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g id="mouth-smile" opacity={mouth === "smile" ? 1 : 0}>
          <path
            d="M-18 54 Q0 70 18 54"
            stroke={C.blue}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g id="mouth-half" opacity={mouth === "half" ? 1 : 0}>
          <ellipse cx="0" cy="58" rx="14" ry="7" fill={C.blue} />
        </g>
        <g id="mouth-open" opacity={mouth === "open" ? 1 : 0}>
          <ellipse cx="0" cy="60" rx="15" ry="12" fill={C.blue} />
          <ellipse cx="0" cy="62" rx="8" ry="5" fill={C.navy} opacity="0.35" />
        </g>
        <g id="mouth-round" opacity={mouth === "round" ? 1 : 0}>
          <circle cx="0" cy="60" r="11" fill={C.blue} />
        </g>
      </g>
    </svg>
  );
};
