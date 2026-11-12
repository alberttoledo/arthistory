// Browser-safe: imported by the Remotion bundle. No Node APIs here.
import type { Scene, Style, WordTiming } from "./schemas.ts";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
/** Hold after the last word so the ending can breathe / loop. */
export const TAIL_SECONDS = 0.8;

export interface TimedScene extends Scene {
  startFrame: number;
  durationFrames: number;
}

export interface EpisodeProps {
  [key: string]: unknown;
  style: Style;
  scenes: TimedScene[];
  words: WordTiming[];
  vo: string | null;
  assets: Record<string, { file: string; width: number; height: number }>;
  /** URL prefix for files; null = Remotion staticFile() (render), string = HTTP (dashboard preview) */
  assetBase: string | null;
  durationInFrames: number;
}

/** Turn beat-relative scenes into absolute frame ranges using the voice timeline. */
export function timeScenes(scenes: Scene[], beats: { start: number; end: number }[], totalSeconds: number): TimedScene[] {
  const starts = scenes.map((s, i) => {
    if (i === 0) return 0;
    const b = beats[s.beat];
    if (!b) throw new Error(`Scene ${i} refers to beat ${s.beat}, but the script has ${beats.length} beats`);
    return b.start + s.at * (b.end - b.start);
  });
  return scenes.map((s, i) => {
    const startFrame = Math.round(starts[i] * FPS);
    const endFrame = Math.round((i + 1 < scenes.length ? starts[i + 1] : totalSeconds) * FPS);
    return { ...s, startFrame, durationFrames: Math.max(1, endFrame - startFrame) };
  });
}

