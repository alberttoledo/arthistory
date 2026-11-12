import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH, type EpisodeProps } from "../../core/src/episode-props.ts";
import { Episode } from "./Episode.tsx";
import { sampleProps } from "./sample.ts";

export const Root: React.FC = () => (
  <Composition
    id="Episode"
    component={Episode}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    durationInFrames={sampleProps.durationInFrames}
    defaultProps={sampleProps}
    calculateMetadata={({ props }: { props: EpisodeProps }) => ({ durationInFrames: props.durationInFrames })}
  />
);
