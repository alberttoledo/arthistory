import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ParticleKind, Style, TransitionName } from "../schemas.ts";
import { channelDir, getChannel, getStyle, listMoodboards, saveStyle, writeJson } from "../store.ts";
import { generateJson } from "./llm.ts";

const n01 = (what: string) => z.number().describe(`${what}, 0 to 1`);

const StyleProposal = z.object({
  rationale: z.string().describe("2–4 sentences: what you took from the references and brief, in plain words"),
  palette: z.object({
    bg: z.string().describe("hex, frame background / cards"),
    fg: z.string().describe("hex, main text"),
    accent: z.string().describe("hex, highlights, spoken-word highlight, labels"),
    muted: z.string().describe("hex, secondary text"),
  }),
  fonts: z.object({
    display: z.string().describe("Google Fonts family for titles"),
    body: z.string().describe("Google Fonts family for captions; must stay legible at small sizes"),
  }),
  captions: z.object({
    position: z.enum(["top", "center", "bottom"]),
    wordsPerChunk: z.number().int().describe("1–5"),
    uppercase: z.boolean(),
    size: z.number().int().describe("px at 1080 wide, 54–100"),
    highlight: z.enum(["color", "box", "underline", "none"]),
    animation: z.enum(["pop", "rise", "fade", "typewriter", "none"]),
    color: z.string().nullable().describe("hex override for caption text over images, or null to use fg"),
  }),
  motion: z.object({
    intensity: n01("how aggressive camera moves are"),
    transitions: z.array(TransitionName).describe("2–4 transitions used in rotation"),
    transitionFrames: z.number().int().describe("4–30 frames at 30fps"),
  }),
  texture: z.object({
    grain: n01("film grain"),
    vignette: n01("vignette"),
    tint: z.string().nullable().describe("hex color wash, or null"),
  }),
  effects: z.object({
    motionBlur: n01("directional blur on fast moves"),
    depth: n01("parallax layers and 3D tilt"),
    particles: ParticleKind,
    particleAmount: n01("particle density"),
    lightLeaks: n01("warm light leaks"),
    chromaticAberration: n01("RGB split"),
    glow: n01("glow on type"),
    shake: n01("handheld camera drift"),
  }),
  progressBar: z.boolean(),
});

/**
 * Turn a channel's written brief + latest moodboard (images and per-image notes) into a style.json.
 * The previous style is kept in style.previous.json.
 */
export async function proposeStyle(slug: string, log = console.log) {
  const channel = getChannel(slug);
  const current = getStyle(slug);
  const board = listMoodboards(slug)[0];
  const images = (board?.images ?? []).slice(0, 12).map((f) => path.join(board!.dir, f));
  const refs = (board?.images ?? []).slice(0, 12).map((f) => `- ${f}: ${board!.references[f]?.take || "(no note)"}`).join("\n");
  if (!images.length && !current.brief.visual && !current.brief.motion) {
    throw new Error("Add moodboard images or write a visual/motion brief first.");
  }
  log(`  ${images.length} reference images, moodboard ${board?.version ?? "none"}`);

  const proposal = await generateJson({
    log,
    effort: "high",
    schema: StyleProposal,
    system: "You are the motion-design lead for a studio that makes vertical (9:16) video essays for Instagram Reels. You turn references and written direction into precise style settings for a code-based video engine.",
    prompt: `Channel: ${channel.name} — ${channel.niche}
Audience: ${channel.audience}
Tone: ${channel.tone}

Written visual direction:
${current.brief.visual || "(none)"}

Written motion / effects direction:
${current.brief.motion || "(none)"}

Moodboard ${board?.version ?? ""} — what to take from each reference:
${refs || "(no images)"}
${board?.notes ? `\nMoodboard notes:\n${board.notes}` : ""}

Current settings (change what the direction calls for, keep what it doesn't mention):
${JSON.stringify({ palette: current.palette, fonts: current.fonts, captions: current.captions, motion: current.motion, texture: current.texture, effects: current.effects }, null, 1)}

Engine notes: transitions available: ${TransitionName.options.join(", ")}. Captions sit over images, so keep contrast high. Prefer distinctive but legible Google Fonts. Follow the per-image notes literally: take only what each note says to take from that image.`,
    images,
  });

  fs.copyFileSync(path.join(channelDir(slug), "style.json"), path.join(channelDir(slug), "style.previous.json"));
  const { rationale, captions, ...rest } = proposal;
  const next = Style.parse({
    ...current, ...rest,
    captions: { ...captions, color: captions.color ?? undefined },
    moodboardVersion: board?.version ?? current.moodboardVersion,
  });
  saveStyle(slug, next);
  writeJson(path.join(channelDir(slug), "style.rationale.json"), { at: new Date().toISOString(), moodboard: board?.version ?? null, rationale });
  log(`  ${rationale}`);
  return { style: next, rationale };
}
