import type { EpisodeProps } from "../../core/src/episode-props.ts";
import { Style } from "../../core/src/schemas.ts";

/** Keyless, asset-free props so the composition opens in Remotion Studio. */
export const sampleProps: EpisodeProps = {
  style: Style.parse({
    moodboardVersion: null,
    palette: { bg: "#0d0b09", fg: "#f3ead8", accent: "#c9a227", muted: "#8a7f6c" },
    fonts: { display: "Playfair Display", body: "Inter" },
    captions: { position: "bottom", wordsPerChunk: 3, uppercase: false, size: 72, highlight: "color" },
    motion: { intensity: 0.5, transitions: ["crossfade", "zoom"], transitionFrames: 12 },
    texture: { grain: 0.15, vignette: 0.4, tint: null },
    progressBar: true,
  }),
  scenes: [
    { beat: 0, at: 0, startFrame: 0, durationFrames: 90, visual: { type: "title", kicker: "Sample", text: "Content Factory", sub: "Episode preview" } },
    { beat: 1, at: 0, startFrame: 90, durationFrames: 90, visual: { type: "starfield", constellation: "orion" } },
    { beat: 2, at: 0, startFrame: 180, durationFrames: 90, visual: { type: "text", text: "Every channel, its own look.", attribution: "The plan" } },
  ],
  words: "This is a sample episode rendered from code with captions synced to every word".split(" ")
    .map((text, i) => ({ text, start: i * 0.55, end: i * 0.55 + 0.45 })),
  vo: null,
  assets: {},
  assetBase: null,
  durationInFrames: 270,
};
