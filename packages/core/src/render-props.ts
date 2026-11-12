import fs from "node:fs";
import { TAIL_SECONDS, FPS, timeScenes, type EpisodeProps } from "./episode-props.ts";
import type { ScenePlan, VoiceTimeline } from "./schemas.ts";
import {
  episodeFiles, getStyle, readAssetManifest, readBeats, readScenes, readTimeline,
} from "./store.ts";
import { estimateWordTimings } from "./voice/timing.ts";

export function buildEpisodeProps(slug: string, id: string, assetBase: string | null = null): EpisodeProps {
  const style = getStyle(slug);
  const plan = readScenes(slug, id);
  const timeline = readTimeline(slug, id);
  const manifest = readAssetManifest(slug, id);
  const total = timeline.duration + TAIL_SECONDS;
  return {
    style,
    scenes: timeScenes(plan.scenes, timeline.beats, total),
    words: timeline.words,
    vo: "vo.mp3",
    assets: Object.fromEntries(Object.entries(manifest).map(([k, a]) => [k, { file: a.file, width: a.width, height: a.height }])),
    assetBase,
    durationInFrames: Math.round(total * FPS),
  };
}

/** Rough narration timing (≈2.6 words/s) for episodes that have no voice yet. */
function estimatedTimeline(beats: string[]): VoiceTimeline {
  const timeline: VoiceTimeline = { provider: "estimate", duration: 0, beats: [], words: [] };
  let t = 0;
  for (const text of beats) {
    const dur = Math.max(1.5, text.split(/\s+/).length / 2.6);
    timeline.beats.push({ start: t, end: t + dur });
    timeline.words.push(...estimateWordTimings(text, t, t + dur));
    t += dur + 0.35;
  }
  timeline.duration = Math.max(1, t - 0.35);
  return timeline;
}

export interface PreviewResult {
  props: EpisodeProps | null;
  /** what is missing or broken, in plain words */
  problems: string[];
  voiced: boolean;
}

/**
 * Props for the live preview. Unlike buildEpisodeProps it never throws for missing steps:
 * no voice → estimated timing, missing images → placeholders, broken JSON → reported.
 */
export function buildPreviewProps(slug: string, id: string, assetBase: string): PreviewResult {
  const files = episodeFiles(slug, id);
  const problems: string[] = [];
  let plan: ScenePlan;
  let beats: string[];
  try {
    plan = readScenes(slug, id);
    beats = readBeats(slug, id);
  } catch (e) {
    return { props: null, problems: [(e as Error).message], voiced: false };
  }
  const voiced = fs.existsSync(files.timeline) && fs.existsSync(files.vo);
  const timeline = voiced ? readTimeline(slug, id) : estimatedTimeline(beats);
  if (!voiced) problems.push("No voiceover yet. Timing is estimated.");
  if (timeline.beats.length !== beats.length) problems.push("The script changed since the voiceover was made. Run Voice again.");

  const manifest = fs.existsSync(files.assetManifest) ? readAssetManifest(slug, id) : {};
  const used = new Set(plan.scenes.flatMap((s) => (s.visual.type === "image" ? [s.visual.asset] : [])));
  const missing = [...used].filter((k) => !manifest[k]);
  if (missing.length) problems.push(`Images not downloaded yet: ${missing.join(", ")}.`);

  const badBeat = plan.scenes.findIndex((s, i) => i > 0 && !timeline.beats[s.beat]);
  if (badBeat >= 0) return { props: null, problems: [...problems, `Scene ${badBeat + 1} points at beat ${plan.scenes[badBeat].beat}, but the script has ${timeline.beats.length} beats.`], voiced };

  const total = timeline.duration + TAIL_SECONDS;
  return {
    voiced,
    problems,
    props: {
      style: getStyle(slug),
      scenes: timeScenes(plan.scenes, timeline.beats, total),
      words: timeline.words,
      vo: voiced ? "vo.mp3" : null,
      assets: Object.fromEntries(Object.entries(manifest).map(([k, a]) => [k, { file: a.file, width: a.width, height: a.height }])),
      assetBase,
      durationInFrames: Math.round(total * FPS),
    },
  };
}
