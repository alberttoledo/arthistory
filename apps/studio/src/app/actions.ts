"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  AssetSpec, Episode, EpisodeStatus, Metrics, MoodboardReferences, ScenePlan, Style,
  episodeDir, episodeFiles, getChannel, getEpisode, listMoodboards, logFollowers, moodboardDir,
  saveChannel, saveEpisode, saveMoodboardReferences, writeJson, channelDir,
} from "@cf/core";
import { enqueue } from "@/lib/jobs";

export type Result = { ok: true } | { ok: false; error: string };

const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : String(e) });

function parseJson<T extends z.ZodType>(text: string, schema: T, what: string): z.infer<T> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new Error(`${what} is not valid JSON: ${(e as Error).message}`);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new Error(`${what} has problems:\n${z.prettifyError(parsed.error)}`);
  return parsed.data;
}

export async function createEpisode(slug: string, form: FormData): Promise<Result & { id?: string }> {
  try {
    getChannel(slug);
    const title = String(form.get("title") ?? "").trim();
    if (!title) throw new Error("Give the episode a title.");
    const series = String(form.get("series") ?? "") || null;
    const existing = fs.existsSync(path.join(channelDir(slug), "episodes")) ? fs.readdirSync(path.join(channelDir(slug), "episodes")) : [];
    const n = String(existing.length + 1).padStart(3, "0");
    const id = `${n}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}`;
    const files = episodeFiles(slug, id);
    fs.mkdirSync(files.dir, { recursive: true });
    saveEpisode(Episode.parse({ id, channel: slug, series, title, status: "idea", notes: String(form.get("notes") ?? "") }));
    fs.writeFileSync(files.script, `# ${title}\n# One paragraph = one narration beat.\n\nThe hook goes here.\n`);
    fs.writeFileSync(files.assetSpecs, "{}\n");
    writeJson(files.scenes, { scenes: [{ beat: 0, visual: { type: "title", text: title } }] });
    revalidatePath("/", "layout");
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

export async function saveEpisodeFiles(
  slug: string, id: string,
  data: { script?: string; scenes?: string; assets?: string },
): Promise<Result> {
  try {
    const files = episodeFiles(slug, id);
    // Validate everything before writing anything.
    const scenes = data.scenes !== undefined ? parseJson(data.scenes, ScenePlan, "Scenes") : undefined;
    const assets = data.assets !== undefined ? parseJson(data.assets, z.record(z.string(), AssetSpec), "Images") : undefined;
    if (data.script !== undefined) fs.writeFileSync(files.script, data.script);
    if (scenes) writeJson(files.scenes, scenes);
    if (assets) writeJson(files.assetSpecs, assets);
    const ep = getEpisode(slug, id);
    if (ep.status === "idea" && data.script && data.script.split(/\n\s*\n/).length > 2) saveEpisode({ ...ep, status: "scripted" });
    revalidatePath(`/c/${slug}/e/${id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const EpisodeFields = z.object({
  title: z.string().min(1),
  caption: z.string(),
  hashtags: z.array(z.string()),
  scheduledFor: z.string().nullable(),
  status: EpisodeStatus,
  series: z.string().nullable(),
  notes: z.string(),
  hookType: z.string().optional(),
});

export async function updateEpisode(slug: string, id: string, fields: Partial<z.infer<typeof EpisodeFields>>): Promise<Result> {
  try {
    // Drop keys sent as undefined so they don't wipe existing values (null still clears, e.g. unscheduling).
    const f = EpisodeFields.partial().parse(Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)));
    const ep = getEpisode(slug, id);
    const { hookType, ...rest } = f;
    const next = { ...ep, ...rest, tags: hookType !== undefined ? { ...ep.tags, hookType } : ep.tags };
    if (f.status === "posted" && !ep.postedAt) next.postedAt = new Date().toISOString();
    saveEpisode(next);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function addMetrics(slug: string, id: string, form: FormData): Promise<Result> {
  try {
    const num = (k: string) => {
      const v = String(form.get(k) ?? "").replace(/[, ]/g, "");
      return v === "" ? undefined : Number(v);
    };
    const m = Metrics.parse({
      date: String(form.get("date") || new Date().toISOString().slice(0, 10)),
      views: num("views"), likes: num("likes"), comments: num("comments"), saves: num("saves"),
      shares: num("shares"), follows: num("follows"), avgWatchSeconds: num("avgWatchSeconds"),
    });
    const ep = getEpisode(slug, id);
    saveEpisode({ ...ep, metrics: [...ep.metrics.filter((x) => x.date !== m.date), m].sort((a, b) => a.date.localeCompare(b.date)) });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveFollowers(slug: string, form: FormData): Promise<Result> {
  try {
    const followers = Number(String(form.get("followers") ?? "").replace(/[, ]/g, ""));
    if (!Number.isFinite(followers)) throw new Error("Followers must be a number.");
    logFollowers(slug, String(form.get("date") || new Date().toISOString().slice(0, 10)), followers);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveStyle(slug: string, style: unknown): Promise<Result> {
  try {
    writeJson(path.join(channelDir(slug), "style.json"), Style.parse(style));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function uploadMoodboard(slug: string, version: string, form: FormData): Promise<Result> {
  try {
    if (!/^v\d+$/.test(version)) throw new Error("Unknown moodboard version.");
    const dir = moodboardDir(slug, version);
    fs.mkdirSync(dir, { recursive: true });
    for (const file of form.getAll("images")) {
      if (!(file instanceof File) || !file.size) continue;
      if (!/^image\//.test(file.type)) throw new Error(`${file.name} is not an image.`);
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      fs.writeFileSync(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));
    }
    revalidatePath(`/c/${slug}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveMoodboardNotes(slug: string, version: string, notes: string): Promise<Result> {
  try {
    if (!/^v\d+$/.test(version)) throw new Error("Unknown moodboard version.");
    fs.writeFileSync(path.join(moodboardDir(slug, version), "notes.md"), notes);
    revalidatePath(`/c/${slug}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Start a new moodboard version; earlier versions stay as they were for comparison. */
export async function newMoodboardVersion(slug: string): Promise<Result> {
  try {
    const latest = listMoodboards(slug)[0];
    const n = latest ? Number(latest.version.slice(1)) + 1 : 1;
    const dir = moodboardDir(slug, `v${n}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "notes.md"), `# Moodboard v${n}\n\nWhat changed from v${n - 1}:\n`);
    revalidatePath(`/c/${slug}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function startJob(kind: "voice" | "assets" | "render" | "make", slug: string, id: string): Promise<Result> {
  try {
    if (!fs.existsSync(episodeDir(slug, id))) throw new Error("Episode not found.");
    enqueue(kind, slug, id);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveReferences(slug: string, version: string, refs: MoodboardReferences): Promise<Result> {
  try {
    if (!/^v\d+$/.test(version)) throw new Error("Unknown moodboard version.");
    saveMoodboardReferences(slug, version, refs);
    revalidatePath(`/c/${slug}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function removeMoodboardImage(slug: string, version: string, file: string): Promise<Result> {
  try {
    if (!/^v\d+$/.test(version) || file.includes("/") || file.startsWith(".")) throw new Error("Unknown image.");
    // Moved to a trash folder rather than deleted, so a slip can be undone by hand.
    const dir = moodboardDir(slug, version);
    fs.mkdirSync(path.join(dir, ".removed"), { recursive: true });
    fs.renameSync(path.join(dir, file), path.join(dir, ".removed", file));
    revalidatePath(`/c/${slug}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const ChannelFields = z.object({
  name: z.string().min(1), handle: z.string().min(1), niche: z.string(), audience: z.string(), tone: z.string(),
  hashtags: z.array(z.string()), cadencePerWeek: z.number().int().min(1).max(21),
});

export async function updateChannel(slug: string, fields: z.infer<typeof ChannelFields>): Promise<Result> {
  try {
    saveChannel({ ...getChannel(slug), ...ChannelFields.parse(fields) });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const GenerateFields = z.object({
  topic: z.string().min(3, "Describe what the episode or series should be about."),
  count: z.number().int().min(1).max(30),
  series: z.string().nullable(),
  newSeries: z.string().nullable(),
  start: z.string().nullable(),
  every: z.number().int().min(1).max(14),
});

export async function startGenerate(slug: string, fields: z.infer<typeof GenerateFields>): Promise<Result> {
  try {
    const f = GenerateFields.parse(fields);
    getChannel(slug);
    const extra = ["--topic", f.topic, "--count", String(f.count), "--every", String(f.every)];
    if (f.series) extra.push("--series", f.series);
    if (f.newSeries) extra.push("--new-series", f.newSeries);
    if (f.start) extra.push("--start", f.start);
    enqueue("generate", slug, null, extra, f.count === 1 ? "Generate a one-off episode" : `Generate ${f.count} episodes`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function startChannelJob(kind: "style" | "make-all", slug: string): Promise<Result> {
  try {
    getChannel(slug);
    enqueue(kind, slug, null);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Put back the style that was in place before the last "Generate style". */
export async function restorePreviousStyle(slug: string): Promise<Result> {
  try {
    const prev = path.join(channelDir(slug), "style.previous.json");
    if (!fs.existsSync(prev)) throw new Error("There is no earlier style to go back to.");
    const current = path.join(channelDir(slug), "style.json");
    const now = fs.readFileSync(current);
    fs.copyFileSync(prev, current);
    fs.writeFileSync(prev, now); // so the restore itself can be undone
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
