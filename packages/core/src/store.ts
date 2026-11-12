import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  AssetSpec, Channel, Episode, MoodboardReferences, ResolvedAsset, ScenePlan, Series, Style, VoiceTimeline,
} from "./schemas.ts";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const CHANNELS_DIR = path.join(ROOT, "channels");

export const channelDir = (slug: string) => path.join(CHANNELS_DIR, slug);
export const episodeDir = (slug: string, id: string) => path.join(channelDir(slug), "episodes", id);

function readJson<T extends z.ZodType>(file: string, schema: T): z.infer<T> {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid ${path.relative(ROOT, file)}:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

const exists = (f: string) => fs.existsSync(f);

export function listChannels(): Channel[] {
  if (!exists(CHANNELS_DIR)) return [];
  return fs.readdirSync(CHANNELS_DIR)
    .filter((d) => exists(path.join(CHANNELS_DIR, d, "channel.json")))
    .sort()
    .map(getChannel);
}

export const getChannel = (slug: string) => readJson(path.join(channelDir(slug), "channel.json"), Channel);
export const getStyle = (slug: string) => readJson(path.join(channelDir(slug), "style.json"), Style);

export function listSeries(slug: string): Series[] {
  const dir = path.join(channelDir(slug), "series");
  if (!exists(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(dir, f), Series));
}

export function listEpisodes(slug: string): Episode[] {
  const dir = path.join(channelDir(slug), "episodes");
  if (!exists(dir)) return [];
  return fs.readdirSync(dir)
    .filter((d) => exists(path.join(dir, d, "episode.json")))
    .sort()
    .map((id) => getEpisode(slug, id));
}

export const getEpisode = (slug: string, id: string) =>
  readJson(path.join(episodeDir(slug, id), "episode.json"), Episode);

export function saveEpisode(ep: Episode) {
  writeJson(path.join(episodeDir(ep.channel, ep.id), "episode.json"), Episode.parse(ep));
}

/** Paths to every file that belongs to an episode. */
export function episodeFiles(slug: string, id: string) {
  const dir = episodeDir(slug, id);
  return {
    dir,
    script: path.join(dir, "script.md"),
    assetSpecs: path.join(dir, "assets.json"),
    scenes: path.join(dir, "scenes.json"),
    assetsDir: path.join(dir, "assets"),
    assetManifest: path.join(dir, "assets", "manifest.json"),
    voiceDir: path.join(dir, "voice"),
    vo: path.join(dir, "vo.mp3"),
    timeline: path.join(dir, "vo.timeline.json"),
    rendersDir: path.join(dir, "renders"),
  };
}

/**
 * Narration beats from script.md: paragraphs separated by blank lines.
 * Lines starting with `#` are titles/comments and are not spoken.
 */
export function readBeats(slug: string, id: string): string[] {
  const text = fs.readFileSync(episodeFiles(slug, id).script, "utf8");
  return text
    .split(/\n\s*\n/)
    .map((p) => p.split("\n").filter((l) => !l.trim().startsWith("#")).join(" ").trim())
    .filter(Boolean);
}

export const readAssetSpecs = (slug: string, id: string) =>
  readJson(episodeFiles(slug, id).assetSpecs, z.record(z.string(), AssetSpec));
export const readAssetManifest = (slug: string, id: string) =>
  readJson(episodeFiles(slug, id).assetManifest, z.record(z.string(), ResolvedAsset));
export const readScenes = (slug: string, id: string) => readJson(episodeFiles(slug, id).scenes, ScenePlan);
export const readTimeline = (slug: string, id: string) => readJson(episodeFiles(slug, id).timeline, VoiceTimeline);

// ── Channel stats (follower counts logged by hand until the Instagram API is connected) ──

export const FollowerLog = z.array(z.object({ date: z.string(), followers: z.number() }));
export type FollowerLog = z.infer<typeof FollowerLog>;

const statsFile = (slug: string) => path.join(channelDir(slug), "followers.json");

export const readFollowers = (slug: string): FollowerLog =>
  exists(statsFile(slug)) ? readJson(statsFile(slug), FollowerLog) : [];

export function logFollowers(slug: string, date: string, followers: number) {
  const log = readFollowers(slug).filter((e) => e.date !== date);
  log.push({ date, followers });
  log.sort((a, b) => a.date.localeCompare(b.date));
  writeJson(statsFile(slug), log);
}

// ── Moodboards: channels/<slug>/moodboard/v1, v2, … ──

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

export function listMoodboards(slug: string) {
  const dir = path.join(channelDir(slug), "moodboard");
  if (!exists(dir)) return [];
  return fs.readdirSync(dir)
    .filter((d) => /^v\d+$/.test(d))
    .sort((a, b) => Number(b.slice(1)) - Number(a.slice(1)))
    .map((version) => {
      const vdir = path.join(dir, version);
      const notesFile = path.join(vdir, "notes.md");
      const refsFile = path.join(vdir, "references.json");
      return {
        version,
        dir: vdir,
        images: fs.readdirSync(vdir).filter((f) => IMAGE_EXT.test(f)).sort(),
        notes: exists(notesFile) ? fs.readFileSync(notesFile, "utf8") : "",
        references: exists(refsFile) ? readJson(refsFile, MoodboardReferences) : ({} as MoodboardReferences),
      };
    });
}

export const moodboardDir = (slug: string, version: string) => path.join(channelDir(slug), "moodboard", version);

export function saveMoodboardReferences(slug: string, version: string, refs: MoodboardReferences) {
  writeJson(path.join(moodboardDir(slug, version), "references.json"), MoodboardReferences.parse(refs));
}

export function saveStyle(slug: string, style: Style) {
  writeJson(path.join(channelDir(slug), "style.json"), Style.parse(style));
}

export function saveChannel(channel: Channel) {
  writeJson(path.join(channelDir(channel.slug), "channel.json"), Channel.parse(channel));
}
