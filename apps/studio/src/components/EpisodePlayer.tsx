"use client";

import { Player } from "@remotion/player";
import { Episode } from "@cf/video/Episode.tsx";
import { FPS, HEIGHT, WIDTH, type EpisodeProps } from "@cf/core/episode-props.ts";

/** Live, in-browser preview of an episode — the same component that renders the final MP4. */
export function EpisodePlayer({ props, autoPlay = false, loop = false }: { props: EpisodeProps; autoPlay?: boolean; loop?: boolean }) {
  return (
    <Player
      component={Episode}
      inputProps={props}
      durationInFrames={Math.max(1, props.durationInFrames)}
      fps={FPS}
      compositionWidth={WIDTH}
      compositionHeight={HEIGHT}
      controls
      autoPlay={autoPlay}
      loop={loop}
      acknowledgeRemotionLicense
      style={{ width: "100%", aspectRatio: "9 / 16", borderRadius: 10, overflow: "hidden", background: "#000" }}
    />
  );
}
