import { Composition, getStaticFiles, staticFile } from "remotion";
import {
  VideoFromTimeline,
  videoFromTimelineSchema,
  type StudioTimeline,
} from "./compositions/VideoFromTimeline";
import { FPS, SLOT_FRAMES } from "./lib/grid";

async function loadTimeline(videoId: string): Promise<StudioTimeline> {
  const response = await fetch(staticFile(`timelines/${videoId}.json`));
  if (!response.ok) {
    throw new Error(
      `Missing public/timelines/${videoId}.json — run npm run studio:timeline -- ${videoId}`,
    );
  }
  return (await response.json()) as StudioTimeline;
}

export const RemotionRoot: React.FC = () => {
  const ids = getStaticFiles()
    .filter((f) => f.name.startsWith("timelines/") && f.name.endsWith(".json"))
    .map((f) => f.name.replace(/^timelines\//, "").replace(/\.json$/, ""));

  const videoIds =
    ids.length > 0 ? ids : ["20261124-thinker-kenalan"];

  return (
    <>
      {videoIds.map((videoId) => (
        <Composition
          key={videoId}
          id={videoId}
          component={VideoFromTimeline}
          schema={videoFromTimelineSchema}
          fps={FPS}
          width={1080}
          height={1920}
          durationInFrames={11 * SLOT_FRAMES}
          defaultProps={{
            videoId,
            timeline: null,
          }}
          calculateMetadata={async ({ props }) => {
            const timeline = await loadTimeline(props.videoId);
            return {
              durationInFrames: timeline.meta.durationInFrames,
              fps: timeline.meta.fps ?? FPS,
              width: timeline.meta.width ?? 1080,
              height: timeline.meta.height ?? 1920,
              props: {
                ...props,
                timeline,
              },
            };
          }}
        />
      ))}
    </>
  );
};
