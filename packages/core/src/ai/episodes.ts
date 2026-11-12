import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { metCandidates, fetchThumbs, wikimediaCandidates, type Candidate } from "../assets/candidates.ts";
import { Episode, ScenePlan, Series, TransitionName, type AssetSpec, type Scene, type Visual } from "../schemas.ts";
import { channelDir, episodeFiles, getChannel, getStyle, listEpisodes, listSeries, saveEpisode, writeJson } from "../store.ts";
import { generateJson } from "./llm.ts";

const CONSTELLATIONS = ["orion", "ursa-major", "leo", "scorpius", "cassiopeia"];

// ── What we ask Claude for ──

const SeriesPlan = z.object({
  name: z.string(),
  premise: z.string(),
  hookFormula: z.string(),
  structure: z.array(z.string()).describe("beat-by-beat structure every episode follows"),
  targetSeconds: z.number().int(),
  episodes: z.array(z.object({ title: z.string(), angle: z.string().describe("one sentence: what this episode covers and its hook") })),
});

const Point = z.object({ x: z.number(), y: z.number(), zoom: z.number() });

/** Flat on purpose: one object shape for every visual type keeps structured output reliable. */
const DraftScene = z.object({
  beat: z.number().int().describe("index into beats, from 0"),
  at: z.number().describe("0–1, where in the beat this shot starts; 0 for the first shot of a beat"),
  type: z.enum(["image", "title", "text", "list", "starfield"]),
  image: z.string().nullable().describe("image key, for type=image"),
  fit: z.enum(["cover", "contain"]).nullable().describe("cover fills the frame; contain for documents, maps, wide paintings, small photos"),
  from: Point.nullable().describe("camera start: focus x,y (0–1 in the image) and zoom (1 = fit)"),
  to: Point.nullable().describe("camera end"),
  kicker: z.string().nullable(),
  text: z.string().nullable().describe("title text, or quote text for type=text"),
  sub: z.string().nullable(),
  attribution: z.string().nullable(),
  listTitle: z.string().nullable(),
  items: z.array(z.string()).nullable(),
  constellation: z.string().nullable().describe(`for starfield: one of ${CONSTELLATIONS.join(", ")} or null`),
  transition: TransitionName.nullable().describe("null = channel default rotation"),
  label: z.string().nullable().describe("short on-screen label (place/date/name), or null"),
});

export const DraftEpisode = z.object({
  title: z.string(),
  hookType: z.string().describe("kebab-case label for the hook, e.g. question, hidden-detail, bold-claim"),
  beats: z.array(z.string()).describe("narration paragraphs, spoken aloud in order"),
  caption: z.string(),
  hashtags: z.array(z.string()).describe("4–6 specific hashtags, no #"),
  images: z.array(z.object({
    key: z.string().describe("short id used by scenes"),
    search: z.string().describe("search query for Wikimedia Commons (or the Met for artworks)"),
    source: z.enum(["wikimedia", "met"]),
    wants: z.string().describe("what the picture must show, used to choose between results"),
    fallbackText: z.string().describe("short on-screen text to show instead if no good picture exists"),
  })),
  scenes: z.array(DraftScene),
});
type DraftEpisode = z.infer<typeof DraftEpisode>;

const Picks = z.object({
  picks: z.array(z.object({
    key: z.string(),
    choice: z.number().int().describe("index of the best candidate, or -1 if none truly fits"),
    focusX: z.number().describe("0–1, where the important subject is horizontally"),
    focusY: z.number().describe("0–1, vertically"),
  })),
});

// ── Prompts ──

function channelBrief(slug: string) {
  const c = getChannel(slug);
  const s = getStyle(slug);
  return `Channel: ${c.name} (${c.handle})
What it's about: ${c.niche}
Audience: ${c.audience}
Voice and tone: ${c.tone}
Visual direction: ${s.brief.visual || "(see style)"}
Motion direction: ${s.brief.motion || "(see style)"}
Default transitions: ${s.motion.transitions.join(", ")}`;
}

const WRITER_SYSTEM = `You are the head writer and editor of short vertical video essays (Instagram Reels, 9:16) that are made entirely in code: archival and public-domain images with camera moves, title cards, list cards, quote cards and kinetic captions over a voiceover.

Writing rules:
- Beat 1 is the hook: under 14 words, makes a scroller stop. No "In this video".
- 6–9 beats, 110–160 words total (≈40–55 seconds). Written for the ear: short sentences, concrete nouns, one idea per beat.
- Only well-established facts. Hedge anything contested ("the story goes", "historians think"). Never invent quotes, numbers or sources.
- End with a line that lands the idea or invites a share/follow, in the channel's voice.

Scene rules:
- A new shot every 2–4 seconds: use several scenes per beat via "at" (0, 0.5 …). The first scene must be beat 0 at 0.
- Use images for most shots. Every image key you use must be listed in images. Plan 3–6 distinct images, reusing them with different camera moves.
- Camera: from/to focus points 0–1 and zoom 1–1.6; push in on the subject, pan across wide pictures.
- Use title/list/text cards for numbers, lists and the closing line (1–3 per episode).
- Image searches must find real, freely licensed pictures on Wikimedia Commons (historic photos, paintings, maps, engravings, well-known places, public-domain artworks). Be specific (name, place, year). Avoid modern brands, celebrities' recent photos, and anything likely copyrighted.`;

// ── Pipeline ──

export interface GenerateOptions {
  topic: string;
  count: number;
  seriesId?: string | null;
  newSeriesName?: string | null;
  startDate?: string | null;
  everyDays?: number;
  log?: (s: string) => void;
}

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Find candidates for each requested image and let Claude look at them and choose. */
async function chooseImages(draft: DraftEpisode, log: (s: string) => void) {
  const slots: { key: string; wants: string; cands: Candidate[]; thumbs: string[] }[] = [];
  for (const img of draft.images) {
    let cands = img.source === "met" ? await metCandidates(img.search).catch(() => []) : [];
    if (cands.length < 3) cands = [...cands, ...(await wikimediaCandidates(img.search).catch(() => []))].slice(0, 5);
    const thumbs = cands.length ? await fetchThumbs(cands).catch(() => []) : [];
    log(`  ${img.key}: ${cands.length} candidates for “${img.search}”`);
    slots.push({ key: img.key, wants: img.wants, cands: thumbs.length === cands.length ? cands : [], thumbs });
  }
  const withCands = slots.filter((s) => s.cands.length);
  if (!withCands.length) return new Map<string, { cand: Candidate; fx: number; fy: number }>();
  const picks = await generateJson({
    log,
    effort: "medium",
    schema: Picks,
    system: "You are a photo editor choosing pictures for a short video. You are strict: a picture must actually show what is needed and must not contradict the narration.",
    prompt: `For each slot, choose the candidate image that best shows what is wanted, or -1 if none truly fits. Also give the focus point of the subject in the chosen image.

${withCands.map((s) => `Slot "${s.key}" needs: ${s.wants}\n${s.cands.map((c, i) => `  [${i}] ${path.basename(s.thumbs[i])} — ${c.title} (${c.license})`).join("\n")}`).join("\n\n")}`,
    images: withCands.flatMap((s) => s.thumbs),
  });
  const chosen = new Map<string, { cand: Candidate; fx: number; fy: number }>();
  for (const p of picks.picks) {
    const slot = withCands.find((s) => s.key === p.key);
    if (slot && p.choice >= 0 && slot.cands[p.choice]) chosen.set(p.key, { cand: slot.cands[p.choice], fx: p.focusX, fy: p.focusY });
  }
  return chosen;
}

/** Convert the flat draft scenes into the engine's scene plan; images without a picture become text cards. */
export function toScenes(draft: DraftEpisode, chosen: Map<string, { cand: Candidate; fx: number; fy: number }>): Scene[] {
  const fallback = new Map(draft.images.map((i) => [i.key, i.fallbackText]));
  const scenes = draft.scenes
    .filter((s) => s.beat >= 0 && s.beat < draft.beats.length)
    .sort((a, b) => a.beat - b.beat || a.at - b.at)
    .map((s): Scene => {
      let visual: Visual;
      const pick = s.image ? chosen.get(s.image) : undefined;
      if (s.type === "image" && s.image && pick) {
        // The writer can't see the picture, so aim the camera at the subject the photo editor found —
        // unless the writer asked for a deliberate pan (start and end far apart), which we keep.
        const pan = !!s.from && !!s.to && Math.abs(s.from.x - s.to.x) > 0.25;
        visual = {
          type: "image", asset: s.image, fit: s.fit ?? "cover",
          from: { x: pan ? s.from!.x : pick.fx, y: pick.fy, zoom: s.from?.zoom ?? 1.15 },
          to: { x: pan ? s.to!.x : pick.fx, y: pick.fy, zoom: s.to?.zoom ?? 1.0 },
        };
      } else if (s.type === "image") {
        visual = { type: "text", text: (s.image && fallback.get(s.image)) || s.label || s.text || "…" };
      } else if (s.type === "title") {
        visual = { type: "title", text: s.text ?? draft.title, kicker: s.kicker ?? undefined, sub: s.sub ?? undefined };
      } else if (s.type === "list") {
        visual = { type: "list", title: s.listTitle ?? s.text ?? "", items: s.items?.length ? s.items : ["…"] };
      } else if (s.type === "starfield") {
        visual = { type: "starfield", constellation: s.constellation && CONSTELLATIONS.includes(s.constellation) ? s.constellation : undefined };
      } else {
        visual = { type: "text", text: s.text ?? "", attribution: s.attribution ?? undefined };
      }
      return {
        beat: s.beat, at: Math.min(0.95, Math.max(0, s.at)), visual,
        ...(s.transition ? { transition: s.transition } : {}),
        ...(s.label ? { overlay: { text: s.label, position: "top" as const } } : {}),
      };
    });
  if (scenes.length) scenes[0] = { ...scenes[0], beat: 0, at: 0 };
  return ScenePlan.parse({ scenes }).scenes;
}

export async function generateEpisodes(slug: string, opts: GenerateOptions) {
  const log = opts.log ?? console.log;
  const channel = getChannel(slug);
  const count = Math.max(1, Math.min(30, opts.count));
  const existing = listEpisodes(slug);

  // 1. Series: reuse, create, or none for a one-off.
  let series: Series | null = opts.seriesId ? listSeries(slug).find((s) => s.id === opts.seriesId) ?? null : null;
  let plan: { title: string; angle: string }[] = [{ title: opts.topic, angle: opts.topic }];
  if (count > 1 || opts.newSeriesName) {
    log(`Planning ${count} episodes…`);
    const sp = await generateJson({
      log, effort: "high", schema: SeriesPlan, system: WRITER_SYSTEM,
      prompt: `${channelBrief(slug)}

${series ? `Existing series "${series.name}": ${series.premise}\nHook formula: ${series.hookFormula}\nStructure: ${series.structure.join(" → ")}` : `Create a new recurring series${opts.newSeriesName ? ` called "${opts.newSeriesName}"` : ""}.`}

Topic / direction from the producer: ${opts.topic}

Plan exactly ${count} episodes. Each must stand alone but make viewers want the next. Avoid repeating these existing titles: ${existing.map((e) => e.title).join("; ") || "none"}.`,
    });
    plan = sp.episodes.slice(0, count);
    if (!series) {
      series = Series.parse({ id: slugify(sp.name), name: sp.name, premise: sp.premise, hookFormula: sp.hookFormula, structure: sp.structure, targetSeconds: sp.targetSeconds });
      writeJson(path.join(channelDir(slug), "series", `${series.id}.json`), series);
      log(`  new series: ${series.name}`);
    }
  }

  // 2. Each episode: script + scenes, then pictures.
  const created: string[] = [];
  let n = existing.length;
  for (const [i, ep] of plan.entries()) {
    log(`Writing ${i + 1}/${plan.length}: ${ep.title}`);
    const draft = await generateJson({
      log, effort: "high", schema: DraftEpisode, system: WRITER_SYSTEM,
      prompt: `${channelBrief(slug)}
${series ? `\nSeries "${series.name}": ${series.premise}\nHook formula: ${series.hookFormula}\nStructure: ${series.structure.join(" → ")}\nTarget length: ${series.targetSeconds}s` : ""}
${plan.length > 1 ? `\nThis is episode ${i + 1} of ${plan.length}. Other episodes: ${plan.map((p) => p.title).join("; ")}.` : ""}

Episode: ${ep.title}
Angle: ${ep.angle}
Producer's direction: ${opts.topic}

Base hashtags the channel always adds (don't repeat them): ${channel.hashtags.join(", ")}.`,
    });
    const chosen = await chooseImages(draft, log);
    const scenes = toScenes(draft, chosen);

    n += 1;
    const id = `${String(n).padStart(3, "0")}-${slugify(draft.title)}`;
    const files = episodeFiles(slug, id);
    fs.mkdirSync(files.dir, { recursive: true });
    fs.writeFileSync(files.script, `# ${draft.title}\n# Generated from: ${opts.topic.replace(/\n/g, " ")}\n\n${draft.beats.join("\n\n")}\n`);
    const assets: Record<string, AssetSpec> = {};
    for (const [key, { cand }] of chosen) assets[key] = { source: cand.source, maxWidth: 3000 };
    writeJson(files.assetSpecs, assets);
    writeJson(files.scenes, { scenes });
    saveEpisode(Episode.parse({
      id, channel: slug, series: series?.id ?? null, title: draft.title, status: "scripted",
      scheduledFor: opts.startDate ? addDays(opts.startDate, i * Math.max(1, opts.everyDays ?? 1)) : null,
      caption: draft.caption, hashtags: draft.hashtags.map((h) => h.replace(/^#/, "")),
      tags: { hookType: draft.hookType, ...(plan.length > 1 ? { part: `${i + 1}/${plan.length}` } : {}) },
      notes: `Generated from: ${opts.topic}`,
    }));
    const missing = draft.images.filter((im) => !chosen.has(im.key)).map((im) => im.key);
    log(`  saved ${id} (${draft.beats.length} beats, ${scenes.length} shots${missing.length ? `, no good picture for: ${missing.join(", ")}` : ""})`);
    created.push(id);
  }
  return created;
}
