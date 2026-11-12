import { z } from "zod";

/** Wall-clock time in the channel's timezone, e.g. "2026-11-20T18:00". Never converted. */
const WallTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "use YYYY-MM-DDTHH:mm");

export const TakeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Repo-relative path of the raw file (may be git-ignored). */
  file: z.string(),
  label: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  seconds: z.number().optional(),
  generated: z.string().optional(),
  tool: z.string().optional(),
  prompt: z.string().optional(),
  settings: z.string().optional(),
  refs: z.array(z.string()).default([]),
  source: z.string().optional(),
  note: z.string().optional(),
  /** Take id this one was made from (upscale, captions…). */
  derivedFrom: z.string().optional(),
  process: z.string().optional(),
  final: z.boolean().default(false),
  /** false = Claude's guess, waiting for the owner. */
  confirmed: z.boolean().default(false),
});

export const PieceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  role: z.enum(["teaser", "film", "carousel", "extra"]),
  kind: z.string().optional(),
  title: z.string(),
  takes: z.array(TakeSchema).default([]),
  /** Carousel pieces: slug under channels/<channel>/carousels/. */
  carousel: z.string().optional(),
  status: z.enum(["draft", "final"]).optional(),
  note: z.string().optional(),
});

export const PostSchema = z.object({
  piece: z.string(),
  platform: z.string().default("instagram"),
  at: WallTime,
  status: z.enum(["planned", "published"]),
  url: z.string().url().optional(),
  note: z.string().optional(),
});

export const StorySchema = z.object({
  slug: z.string(),
  no: z.string(),
  title: z.string(),
  artist: z.string().default(""),
  year: z.string().default(""),
  museum: z.string().default(""),
  /** Repo folder (committed) holding web copies, posters, thumbs and refs/. */
  mediaDir: z.string(),
  /** Which piece fills each rollout role. */
  rollout: z.object({ teaser: z.string().optional(), film: z.string().optional(), carousel: z.string().optional() }).default({}),
  pieces: z.array(PieceSchema),
  posts: z.array(PostSchema).default([]),
  note: z.string().optional(),
});

export type Take = z.infer<typeof TakeSchema>;
export type Piece = z.infer<typeof PieceSchema>;
export type Post = z.infer<typeof PostSchema>;
export type Story = z.infer<typeof StorySchema>;
export type Role = "teaser" | "film" | "carousel";
export const ROLES: Role[] = ["teaser", "film", "carousel"];
