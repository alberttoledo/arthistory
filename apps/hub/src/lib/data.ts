// The ONLY module that reads hub content. Phase 2 swaps these loaders for Firebase.
import carouselData from "@/data/carousels.json";
import hubData from "@/data/hub.json";
import { StorySchema, type Story } from "./schema";

export type Slide = { n: number; type: string; headline: string; alt: string };
export type Carousel = {
  slug: string; no: string; title: string; artist: string; year: string; museum: string;
  videoFormat: string; hook: string; caption: string; hashtags: string[]; notes: string;
  slides: Slide[]; renders: string[]; zip: string; sources: string;
};
export type Channel = { slug: string; name: string; handle: string; timezone: string; stories: StoryWithMedia[] };
export type StoryWithMedia = Story & { channel: string; media: string[] };

type RawStory = Record<string, unknown> & { _file: string; channel: string; media: string[] };
type RawChannel = { slug: string; name: string; handle: string; timezone: string; stories: RawStory[] };

export const DEFAULT_CHANNEL = "art-history";

const channels: Channel[] = (hubData as { channels: RawChannel[] }).channels.map((ch) => ({
  ...ch,
  stories: ch.stories.map(({ _file, channel, media, ...raw }) => {
    const parsed = StorySchema.safeParse(raw);
    if (!parsed.success) throw new Error(`Invalid story file ${_file}:\n${parsed.error.message}`);
    return { ...parsed.data, channel, media };
  }).sort((a, b) => a.no.localeCompare(b.no)),
}));

export const getChannels = () => channels;
export const getChannel = (slug: string) => channels.find((c) => c.slug === slug);
export const getStories = (channel: string) => getChannel(channel)?.stories ?? [];
export const getStory = (channel: string, slug: string) => getStories(channel).find((s) => s.slug === slug);

export const carousels = carouselData as Carousel[];
export const getCarousel = (slug: string) => carousels.find((c) => c.slug === slug);
export const totalSlides = carousels.reduce((a, c) => a + c.renders.length, 0);
export const tagLine = (c: Carousel) => c.hashtags.map((h) => "#" + h.replace(/^#/, "")).join(" ");

/** Prefix a public file path with the GitHub Pages base path. */
export const asset = (p: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/${p.replace(/^\//, "")}`;
/** URL of a file in a story's web media folder, or null if it wasn't built. */
export const mediaUrl = (story: StoryWithMedia, file: string) => (story.media.includes(file) ? asset(`media/${story.slug}/${file}`) : null);
export const refFile = (ref: string) => `refs/${ref.split("/").pop()!.replace(/\.[^.]+$/, "")}.jpg`;

/** Tiny, safe markdown for sources.md: headings, bullets, links, bold. */
export function mdToHtml(src: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
  return esc(src).split("\n").map((l) => {
    l = l.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    if (/^#{1,6}\s/.test(l)) return `<h4>${l.replace(/^#+\s/, "")}</h4>`;
    if (/^\s*[-*]\s/.test(l)) return `<li>${l.replace(/^\s*[-*]\s/, "")}</li>`;
    return l.trim() ? `<p>${l}</p>` : "";
  }).join("");
}
