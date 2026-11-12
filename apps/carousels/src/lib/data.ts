import data from "@/data/carousels.json";

export type Slide = { n: number; type: string; headline: string; alt: string };
export type Carousel = {
  slug: string; no: string; title: string; artist: string; year: string; museum: string;
  videoFormat: string; hook: string; caption: string; hashtags: string[]; notes: string;
  slides: Slide[]; renders: string[]; zip: string; sources: string;
};

export const carousels = data as Carousel[];
export const getCarousel = (slug: string) => carousels.find((c) => c.slug === slug);
export const totalSlides = carousels.reduce((a, c) => a + c.renders.length, 0);
export const tagLine = (c: Carousel) => c.hashtags.map((h) => "#" + h.replace(/^#/, "")).join(" ");

/** Prefix a public file path with the GitHub Pages base path. */
export const asset = (p: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/${p.replace(/^\//, "")}`;

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
