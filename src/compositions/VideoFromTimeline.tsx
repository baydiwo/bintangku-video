/**
 * Composition utama per videoId (TRD §07.1).
 * Data-driven dari timeline.json (CLI).
 */
import React, { useMemo } from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { Thinker, type MouthShape } from "../characters/Thinker";
import { CaptionStrip } from "../components/CaptionStrip";
import { CosmicBackground } from "../components/CosmicBackground";
import { SLOT_FRAMES } from "../lib/grid";

const CaptionWordSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().optional(),
  confidence: z.number().nullable().optional(),
});

const TimelineSchema = z.object({
  meta: z.object({
    videoId: z.string(),
    fps: z.number(),
    slotFrames: z.number(),
    totalSlots: z.number(),
    durationInFrames: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  slots: z.array(
    z.object({
      index: z.number(),
      beatId: z.string(),
      from: z.number(),
      durationInFrames: z.number(),
    }),
  ),
  elements: z.array(z.record(z.string(), z.unknown())),
  text: z.array(z.record(z.string(), z.unknown())),
  audio: z.array(z.record(z.string(), z.unknown())),
  mouthTracks: z.array(
    z.object({
      beatId: z.string(),
      frames: z.array(
        z.object({
          frame: z.number(),
          shape: z.string(),
        }),
      ),
    }),
  ),
  approvalHash: z.string(),
});

export type StudioTimeline = z.infer<typeof TimelineSchema>;

export const videoFromTimelineSchema = z.object({
  videoId: z.string(),
  timeline: TimelineSchema.nullable(),
});

export type VideoFromTimelineProps = z.infer<typeof videoFromTimelineSchema>;

type ElementRow = {
  slotIndex: number;
  kind: string;
  props?: Record<string, unknown>;
  enter?: string;
  exit?: string;
  motion?: string;
};

type AudioRow = {
  kind: string;
  src: string;
  from: number;
  durationInFrames: number;
  volume?: number;
};

type TextRow = {
  kind: string;
  from: number;
  to: number;
  captions?: Array<z.infer<typeof CaptionWordSchema>>;
};

function asElements(raw: unknown[]): ElementRow[] {
  return raw as ElementRow[];
}

export const VideoFromTimeline: React.FC<VideoFromTimelineProps> = ({
  videoId,
  timeline,
}) => {
  if (!timeline) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#0d1b4b",
          color: "#f5f4f0",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 48,
        }}
      >
        No timeline for {videoId}
      </AbsoluteFill>
    );
  }

  const mouthByBeat = useMemo(() => {
    const map = new Map<string, Array<{ frame: number; shape: string }>>();
    for (const t of timeline.mouthTracks) {
      map.set(t.beatId, t.frames);
    }
    return map;
  }, [timeline.mouthTracks]);

  const elements = asElements(timeline.elements);
  const audio = timeline.audio as AudioRow[];
  const text = timeline.text as TextRow[];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1b4b" }}>
      {timeline.slots.map((slot) => {
        const slotEls = elements.filter((e) => e.slotIndex === slot.index);
        const bg = slotEls.find((e) => e.kind === "background");
        const character = slotEls.find((e) => e.kind === "character");
        const bgProps = (bg?.props ?? {}) as {
          type?: string;
          palette?: string;
        };
        const ch = (character?.props ?? {}) as {
          pose?: string;
          expression?: string;
          x?: number;
          y?: number;
          scale?: number;
          facing?: "left" | "right";
        };

        const track = mouthByBeat.get(slot.beatId);
        const relativeTrack = track?.map((row) => ({
          frame: row.frame - slot.from,
          shape: row.shape as MouthShape,
        }));

        return (
          <Sequence
            key={`slot-${slot.index}`}
            from={slot.from}
            durationInFrames={slot.durationInFrames || SLOT_FRAMES}
            name={`${slot.beatId}@${slot.index}`}
          >
            <CosmicBackground
              type={bgProps.type}
              palette={bgProps.palette}
              seed={`${videoId}-${slot.index}`}
            />
            {character ? (
              <Thinker
                pose={ch.pose as never}
                expression={ch.expression as never}
                x={typeof ch.x === "number" ? ch.x : 0.5}
                y={typeof ch.y === "number" ? ch.y : 0.62}
                scale={typeof ch.scale === "number" ? ch.scale : 1}
                facing={ch.facing ?? "right"}
                motion={(character.motion as never) ?? "float"}
                enter={(character.enter as never) ?? "pop"}
                exit={(character.exit as never) ?? "none"}
                mouth="auto"
                mouthTrack={relativeTrack}
                seed={`${videoId}-${slot.index}`}
              />
            ) : null}
          </Sequence>
        );
      })}

      {text
        .filter((t) => t.kind === "caption" && t.captions?.length)
        .map((t, i) => (
          <Sequence
            key={`cap-${i}`}
            from={t.from}
            durationInFrames={Math.max(1, t.to - t.from)}
          >
            <CaptionStrip
              captions={(t.captions ?? []).map((c) => ({
                ...c,
                // captions use absolute ms; shift to sequence-local
                startMs: c.startMs - (t.from / timeline.meta.fps) * 1000,
                endMs: c.endMs - (t.from / timeline.meta.fps) * 1000,
              }))}
            />
          </Sequence>
        ))}

      {audio
        .filter((a) => a.kind === "vo" || a.kind === "vo-sung" || a.kind === "sfx")
        .map((a, i) => (
          <Sequence
            key={`aud-${i}`}
            from={a.from}
            durationInFrames={a.durationInFrames}
          >
            <Audio
              src={staticFile(a.src.replace(/^\//, ""))}
              volume={a.volume ?? 1}
            />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
