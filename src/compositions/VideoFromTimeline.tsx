/**
 * Composition utama per videoId (TRD §07.1) + per-scene (DEC-57 / FR-PRV-001).
 * Data-driven dari timeline.json (CLI).
 */
import React, { useMemo } from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { MascotStill } from "../characters/MascotStill";
import { Salman } from "../characters/Salman";
import { Thinker, type MouthShape } from "../characters/Thinker";
import { CaptionStrip } from "../components/CaptionStrip";
import { CosmicBackground } from "../components/CosmicBackground";
import { EndCard } from "../components/EndCard";
import { SLOT_FRAMES } from "../lib/grid";



const CaptionWordSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().optional(),
  confidence: z.number().nullable().optional(),
});

const TimelineSceneSchema = z.object({
  id: z.string(),
  beatId: z.string(),
  from: z.number(),
  durationInFrames: z.number(),
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
    pacing: z.enum(["scene", "grid"]).optional(),
  }),
  scenes: z.array(TimelineSceneSchema).optional(),
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
      beatId: z.string().optional(),
      sceneId: z.string().optional(),
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
  /** When set, render only this scene (composition `<videoId>-S01`) */
  sceneId: z.string().nullable().optional(),
});

export type VideoFromTimelineProps = z.infer<typeof videoFromTimelineSchema>;

type ElementRow = {
  slotIndex: number;
  kind: string;
  props?: Record<string, unknown>;
  enter?: string;
  exit?: string;
  motion?: string;
  sceneId?: string;
};

type AudioRow = {
  kind: string;
  src: string;
  from: number;
  durationInFrames: number;
  volume?: number;
  sceneId?: string;
};

type TextRow = {
  kind: string;
  from: number;
  to: number;
  captions?: Array<z.infer<typeof CaptionWordSchema>>;
  sceneId?: string;
  content?: string;
};

function asElements(raw: unknown[]): ElementRow[] {
  return raw as ElementRow[];
}

export const VideoFromTimeline: React.FC<VideoFromTimelineProps> = ({
  videoId,
  timeline,
  sceneId = null,
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

  const isScenePacing =
    timeline.meta.pacing === "scene" || Boolean(timeline.scenes?.length);

  const activeScenes = useMemo(() => {
    const all = timeline.scenes ?? [];
    if (!sceneId) return all;
    return all.filter((s) => s.id === sceneId);
  }, [timeline.scenes, sceneId]);

  const sceneOffset = sceneId
    ? (timeline.scenes?.find((s) => s.id === sceneId)?.from ?? 0)
    : 0;

  const mouthByKey = useMemo(() => {
    const map = new Map<string, Array<{ frame: number; shape: string }>>();
    for (const t of timeline.mouthTracks) {
      if (t.sceneId) map.set(t.sceneId, t.frames);
      if (t.beatId) map.set(t.beatId, t.frames);
    }
    return map;
  }, [timeline.mouthTracks]);

  const elements = asElements(timeline.elements);
  const audio = timeline.audio as AudioRow[];
  const text = timeline.text as TextRow[];

  if (isScenePacing && activeScenes.length > 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#0d1b4b" }}>
        {activeScenes.map((scene) => {
          const from = scene.from - sceneOffset;
          const slotIndex =
            timeline.slots.find((s) => s.from === scene.from)?.index ??
            timeline.slots.findIndex((s) =>
              s.beatId.startsWith(`${scene.id}@`),
            );
          const slotEls = elements.filter(
            (e) =>
              e.sceneId === scene.id ||
              (slotIndex >= 0 && e.slotIndex === slotIndex),
          );
          const bg = slotEls.find((e) => e.kind === "background");
          const characters = slotEls.filter((e) => e.kind === "character");
          const bgProps = (bg?.props ?? {}) as {
            type?: string;
            palette?: string;
          };

          const track =
            mouthByKey.get(scene.id) ?? mouthByKey.get(scene.beatId);
          const relativeTrack = track?.map((row) => ({
            frame: row.frame - scene.from,
            shape: row.shape as MouthShape,
          }));

          return (
            <Sequence
              key={scene.id}
              from={Math.max(0, from)}
              durationInFrames={scene.durationInFrames}
              name={`${scene.id}@${scene.beatId}`}
            >
              <CosmicBackground
                type={bgProps.type}
                palette={bgProps.palette}
                seed={`${videoId}-${scene.id}`}
              />
              {(() => {
                const bgType = (bg?.props as { type?: string } | undefined)?.type;
                if (bgType === "endcard" || scene.beatId === "B9") {
                  return <EndCard />;
                }
                return null;
              })()}
              {characters.map((character, ci) => {
                const ch = (character.props ?? {}) as {
                  pose?: string;
                  expression?: string;
                  x?: number;
                  y?: number;
                  scale?: number;
                  facing?: "left" | "right";
                  character?: string;
                };
                const who = (ch.character ?? "").toLowerCase();
                if (who === "salman") {
                  return (
                    <Salman
                      key={`${scene.id}-ch-${ci}`}
                      pose={ch.pose ?? ch.expression ?? "stand"}
                      x={typeof ch.x === "number" ? ch.x : 0.5}
                      y={typeof ch.y === "number" ? ch.y : 0.62}
                      scale={typeof ch.scale === "number" ? ch.scale : 1}
                      facing={ch.facing ?? "right"}
                      motion={(character.motion as never) ?? "float"}
                      enter={(character.enter as never) ?? "pop"}
                      exit={(character.exit as never) ?? "none"}
                    />
                  );
                }
                if (
                  who === "explorer" ||
                  who === "dream-keeper" ||
                  who === "dreamkeeper" ||
                  who === "thinker"
                ) {
                  return (
                    <MascotStill
                      key={`${scene.id}-ch-${ci}`}
                      character={who}
                      x={typeof ch.x === "number" ? ch.x : 0.5}
                      y={typeof ch.y === "number" ? ch.y : 0.62}
                      scale={typeof ch.scale === "number" ? ch.scale : 1}
                      facing={ch.facing ?? "right"}
                      motion={(character.motion as never) ?? "float"}
                      enter={(character.enter as never) ?? "pop"}
                      exit={(character.exit as never) ?? "none"}
                    />
                  );
                }
                return (
                  <Thinker
                    key={`${scene.id}-ch-${ci}`}
                    pose={ch.pose as never}
                    expression={ch.expression as never}
                    x={typeof ch.x === "number" ? ch.x : 0.5}
                    y={typeof ch.y === "number" ? ch.y : 0.62}
                    scale={typeof ch.scale === "number" ? ch.scale : 1}
                    facing={ch.facing ?? "right"}
                    motion={(character.motion as never) ?? "float"}
                    enter={(character.enter as never) ?? "pop"}
                    exit={(character.exit as never) ?? "none"}
                    mouth="smile"
                    mouthTrack={ci === 0 ? relativeTrack : undefined}
                    seed={`${videoId}-${scene.id}-${ci}`}
                  />
                );
              })}
            </Sequence>
          );
        })}

        {text
          .filter((t) => {
            if (sceneId && t.sceneId && t.sceneId !== sceneId) return false;
            return t.kind === "caption" || t.kind === "onScreen";
          })
          .map((t, i) => {
            if (t.kind === "onScreen" && t.content) {
              return (
                <Sequence
                  key={`ost-${i}`}
                  from={Math.max(0, t.from - sceneOffset)}
                  durationInFrames={Math.max(1, t.to - t.from)}
                >
                  <AbsoluteFill
                    style={{
                      justifyContent: "flex-end",
                      alignItems: "center",
                      paddingBottom: 220,
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Fredoka, Nunito Sans, sans-serif",
                        fontSize: 44,
                        fontWeight: 700,
                        color: "#f5f4f0",
                        background: "rgba(13,27,75,0.72)",
                        padding: "14px 28px",
                        borderRadius: 18,
                        maxWidth: 900,
                        textAlign: "center",
                      }}
                    >
                      {t.content}
                    </div>
                  </AbsoluteFill>
                </Sequence>
              );
            }
            if (t.kind !== "caption" || !t.captions?.length) return null;
            return (
              <Sequence
                key={`cap-${i}`}
                from={Math.max(0, t.from - sceneOffset)}
                durationInFrames={Math.max(1, t.to - t.from)}
              >
                <CaptionStrip
                  captions={(t.captions ?? []).map((c) => ({
                    ...c,
                    startMs:
                      c.startMs -
                      ((t.from - sceneOffset) / timeline.meta.fps) * 1000,
                    endMs:
                      c.endMs -
                      ((t.from - sceneOffset) / timeline.meta.fps) * 1000,
                  }))}
                />
              </Sequence>
            );
          })}

        {audio
          .filter((a) => {
            if (!(a.kind === "vo" || a.kind === "vo-sung" || a.kind === "sfx")) {
              return false;
            }
            if (!sceneId) return true;
            return a.sceneId === sceneId;
          })
          .map((a, i) => (
            <Sequence
              key={`aud-${i}`}
              from={Math.max(0, a.from - sceneOffset)}
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
  }

  // Legacy grid slots
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

        const track = mouthByKey.get(slot.beatId);
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
