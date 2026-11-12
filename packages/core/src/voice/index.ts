import fs from "node:fs";
import path from "node:path";
import { ffmpeg, probeDuration } from "../media.ts";
import { episodeFiles, getChannel, readBeats, writeJson } from "../store.ts";
import type { VoiceTimeline, WordTiming } from "../schemas.ts";
import { elevenlabsProvider } from "./elevenlabs.ts";
import { sayProvider } from "./say.ts";
import { estimateWordTimings } from "./timing.ts";

const providers = { say: sayProvider, elevenlabs: elevenlabsProvider };

/** Silence between narration beats, in seconds. */
const BEAT_GAP = 0.35;

/** Synthesize every beat of script.md, stitch into vo.mp3 and write vo.timeline.json. */
export async function voiceEpisode(slug: string, id: string): Promise<VoiceTimeline> {
  const channel = getChannel(slug);
  const files = episodeFiles(slug, id);
  // Fall back to the free voice if the paid one isn't configured yet.
  const useEleven = channel.voice.provider === "elevenlabs" && !!process.env.ELEVENLABS_API_KEY;
  const provider = useEleven ? providers.elevenlabs : providers.say;
  const config = useEleven ? channel.voice : { ...channel.voice, provider: "say" as const };

  fs.rmSync(files.voiceDir, { recursive: true, force: true });
  fs.mkdirSync(files.voiceDir, { recursive: true });

  const beats = readBeats(slug, id);
  const gapWav = path.join(files.voiceDir, "gap.wav");
  ffmpeg(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(BEAT_GAP), gapWav]);

  const parts: string[] = [];
  const timeline: VoiceTimeline = { provider: provider.name, duration: 0, beats: [], words: [] };
  let t = 0;
  for (const [i, text] of beats.entries()) {
    const audio = await provider.synthesize(text, path.join(files.voiceDir, `beat-${i}`), config);
    const words: WordTiming[] = audio.words
      ? audio.words.map((w) => ({ ...w, start: w.start + t, end: w.end + t }))
      : estimateWordTimings(text, t, t + audio.duration);
    timeline.beats.push({ start: t, end: t + audio.duration });
    timeline.words.push(...words);
    parts.push(audio.file);
    t += audio.duration;
    if (i < beats.length - 1) {
      parts.push(gapWav);
      t += BEAT_GAP;
    }
  }

  const list = path.join(files.voiceDir, "concat.txt");
  fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
  ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-ar", "44100", "-b:a", "192k", files.vo]);
  timeline.duration = probeDuration(files.vo);
  writeJson(files.timeline, timeline);
  return timeline;
}
