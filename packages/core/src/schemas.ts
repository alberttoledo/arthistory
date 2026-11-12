import { z } from "zod";

export const VoiceConfig = z.object({
  provider: z.enum(["say", "elevenlabs"]),
  /** macOS voice name for `say`, or ElevenLabs voice id */
  voice: z.string(),
  /** words per minute for `say` */
  rate: z.number().default(175),
  /** voice to switch to once an ElevenLabs key exists */
  elevenlabsVoiceId: z.string().optional(),
});
export type VoiceConfig = z.infer<typeof VoiceConfig>;

export const Channel = z.object({
  slug: z.string(),
  name: z.string(),
  handle: z.string(),
  niche: z.string(),
  audience: z.string(),
  tone: z.string(),
  voice: VoiceConfig,
  cadencePerWeek: z.number().default(7),
  goals: z.object({
    followers: z.number().default(10000),
    views: z.number().default(1000000),
    deadline: z.string(),
  }),
  hashtags: z.array(z.string()).default([]),
  assetSources: z.array(z.enum(["met", "wikimedia", "procedural", "local"])),
});
export type Channel = z.infer<typeof Channel>;

export const TransitionName = z.enum([
  "cut", "crossfade", "zoom", "zoom-out", "whip", "push", "slide-up", "wipe", "iris", "flash", "blur", "glitch", "film-burn",
]);
export type TransitionName = z.infer<typeof TransitionName>;

export const ParticleKind = z.enum(["none", "dust", "bokeh", "embers", "stars", "snow"]);
export type ParticleKind = z.infer<typeof ParticleKind>;

/** Motion-design vocabulary. Every value is 0..1 strength unless noted; 0 turns the effect off. */
export const Effects = z.object({
  /** directional blur on fast moves and transitions */
  motionBlur: z.number().min(0).max(1).default(0.3),
  /** layer depth: parallax background plate, floating image cards with perspective, layered particles */
  depth: z.number().min(0).max(1).default(0.3),
  particles: ParticleKind.default("none"),
  particleAmount: z.number().min(0).max(1).default(0.4),
  lightLeaks: z.number().min(0).max(1).default(0),
  chromaticAberration: z.number().min(0).max(1).default(0),
  /** soft glow on type */
  glow: z.number().min(0).max(1).default(0),
  /** handheld camera drift */
  shake: z.number().min(0).max(1).default(0),
});
export type Effects = z.infer<typeof Effects>;

export const Style = z.object({
  moodboardVersion: z.string().nullable(),
  /** Written direction, in the user's words. The generator turns it (plus the moodboard) into the values below. */
  brief: z.object({
    visual: z.string().default(""),
    motion: z.string().default(""),
  }).default({ visual: "", motion: "" }),
  palette: z.object({
    bg: z.string(),
    fg: z.string(),
    accent: z.string(),
    muted: z.string(),
  }),
  /** Any Google Fonts family name. */
  fonts: z.object({
    display: z.string(),
    body: z.string(),
  }),
  captions: z.object({
    position: z.enum(["top", "center", "bottom"]).default("bottom"),
    wordsPerChunk: z.number().default(3),
    uppercase: z.boolean().default(false),
    size: z.number().default(72),
    highlight: z.enum(["color", "box", "underline", "none"]).default("color"),
    /** override palette.fg for captions (e.g. light captions on a light-paper channel) */
    color: z.string().optional(),
    animation: z.enum(["pop", "rise", "fade", "typewriter", "none"]).default("pop"),
  }),
  motion: z.object({
    /** 0..1 how aggressive zooms/pans are */
    intensity: z.number().min(0).max(1).default(0.5),
    transitions: z.array(TransitionName).min(1),
    transitionFrames: z.number().default(12),
  }),
  texture: z.object({
    grain: z.number().min(0).max(1).default(0.15),
    vignette: z.number().min(0).max(1).default(0.4),
    tint: z.string().nullable().default(null),
  }),
  effects: Effects.default(Effects.parse({})),
  progressBar: z.boolean().default(true),
});
export type Style = z.infer<typeof Style>;

export const Series = z.object({
  id: z.string(),
  name: z.string(),
  premise: z.string(),
  hookFormula: z.string(),
  structure: z.array(z.string()),
  targetSeconds: z.number(),
});
export type Series = z.infer<typeof Series>;

export const EpisodeStatus = z.enum([
  "idea", "scripted", "voiced", "planned", "rendered", "approved", "posted",
]);
export type EpisodeStatus = z.infer<typeof EpisodeStatus>;

export const Metrics = z.object({
  date: z.string(),
  views: z.number().optional(),
  likes: z.number().optional(),
  comments: z.number().optional(),
  saves: z.number().optional(),
  shares: z.number().optional(),
  follows: z.number().optional(),
  avgWatchSeconds: z.number().optional(),
});

export const Episode = z.object({
  id: z.string(),
  channel: z.string(),
  series: z.string().nullable().default(null),
  title: z.string(),
  status: EpisodeStatus,
  scheduledFor: z.string().nullable().default(null),
  postedAt: z.string().nullable().default(null),
  caption: z.string().default(""),
  hashtags: z.array(z.string()).default([]),
  tags: z.object({ hookType: z.string().optional(), part: z.string().optional() }).default({}),
  notes: z.string().default(""),
  metrics: z.array(Metrics).default([]),
});
export type Episode = z.infer<typeof Episode>;

/** A visual is what fills the frame during a scene. */
export const Visual = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("image"),
    /** asset key from assets.json */
    asset: z.string(),
    /** camera move: normalized focus point (0..1) and zoom scale, from → to */
    from: z.object({ x: z.number(), y: z.number(), zoom: z.number() }).default({ x: 0.5, y: 0.5, zoom: 1 }),
    to: z.object({ x: z.number(), y: z.number(), zoom: z.number() }).default({ x: 0.5, y: 0.5, zoom: 1.15 }),
    /** "cover" fills the frame; "contain" letterboxes over a blurred copy */
    fit: z.enum(["cover", "contain"]).default("cover"),
  }),
  z.object({
    type: z.literal("title"),
    kicker: z.string().optional(),
    text: z.string(),
    sub: z.string().optional(),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string(),
    attribution: z.string().optional(),
  }),
  z.object({
    type: z.literal("list"),
    title: z.string(),
    items: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal("starfield"),
    constellation: z.string().optional(),
  }),
]);
export type Visual = z.infer<typeof Visual>;

export const Scene = z.object({
  /** index of the narration beat this scene is timed against */
  beat: z.number(),
  /** split a beat into multiple shots: fraction of the beat where this shot starts */
  at: z.number().min(0).max(1).default(0),
  visual: Visual,
  overlay: z.object({ text: z.string(), position: z.enum(["top", "center", "bottom"]).default("top") }).optional(),
  transition: TransitionName.optional(),
});
export type Scene = z.infer<typeof Scene>;

export const ScenePlan = z.object({
  scenes: z.array(Scene).min(1),
});
export type ScenePlan = z.infer<typeof ScenePlan>;

export const AssetSpec = z.object({
  /** e.g. "wikimedia:File:Foo.jpg", "met:436105", "local:assets/foo.jpg" */
  source: z.string(),
  /** optional crop in normalized coords, applied after download */
  crop: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
  maxWidth: z.number().default(3840),
});
export type AssetSpec = z.infer<typeof AssetSpec>;

export const ResolvedAsset = z.object({
  file: z.string(),
  width: z.number(),
  height: z.number(),
  credit: z.string(),
  sourceUrl: z.string(),
});
export type ResolvedAsset = z.infer<typeof ResolvedAsset>;

export const WordTiming = z.object({ text: z.string(), start: z.number(), end: z.number() });
export type WordTiming = z.infer<typeof WordTiming>;

export const VoiceTimeline = z.object({
  provider: z.string(),
  duration: z.number(),
  beats: z.array(z.object({ start: z.number(), end: z.number() })),
  words: z.array(WordTiming),
});
export type VoiceTimeline = z.infer<typeof VoiceTimeline>;

/** moodboard/vN/references.json: what to take from each reference image. */
export const MoodboardReferences = z.record(z.string(), z.object({ take: z.string().default("") }));
export type MoodboardReferences = z.infer<typeof MoodboardReferences>;
