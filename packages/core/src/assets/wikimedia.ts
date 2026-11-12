import { getJson } from "./fetch.ts";
import type { SourceHit } from "./index.ts";

interface ImageInfo {
  url: string;
  thumburl?: string;
  width: number;
  extmetadata?: Record<string, { value: string }>;
}

/** Largest thumbnail width Commons serves; anything above needs the original file. */
const MAX_THUMB = 3840;

const strip = (html = "") => html
  .replace(/<[^>]+>/g, "")
  .replace(/label QS:\S+?,"[^"]*"/g, "") // Wikidata label markup
  .replace(/\s+/g, " ").trim();

/** `ref` is a Commons file title, e.g. "File:A Sunday on La Grande Jatte, Georges Seurat, 1884.jpg" */
export async function wikimedia(ref: string, width: number): Promise<SourceHit> {
  const title = ref.startsWith("File:") ? ref : `File:${ref}`;
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query", titles: title, prop: "imageinfo", format: "json",
    iiprop: "url|size|extmetadata", iiurlwidth: String(Math.min(width, MAX_THUMB)),
  }).toString();
  const body = await getJson<{ query: { pages: Record<string, { imageinfo?: ImageInfo[] }> } }>(api.toString());
  const info = Object.values(body.query.pages)[0]?.imageinfo?.[0];
  if (!info) throw new Error(`Wikimedia file not found: ${title}`);
  const meta = info.extmetadata ?? {};
  const artist = strip(meta.Artist?.value);
  const license = strip(meta.LicenseShortName?.value) || "see Commons";
  const name = strip(meta.ObjectName?.value).replace(/\s*--.*$/, "") || title.replace(/^File:/, "").replace(/\.\w+$/, "");
  // Detail crops need real pixels: fall back to the (possibly huge, cached) original.
  const useThumb = width <= MAX_THUMB && width < info.width && info.thumburl;
  return {
    url: useThumb ? info.thumburl! : info.url,
    credit: [name, artist, `Wikimedia Commons (${license})`].filter(Boolean).join(" — "),
    pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  };
}

/** Search Commons for file titles (for planning). */
export async function searchWikimedia(query: string, limit = 10): Promise<string[]> {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query", list: "search", srnamespace: "6", srsearch: query, srlimit: String(limit), format: "json",
  }).toString();
  const body = await getJson<{ query: { search: { title: string }[] } }>(api.toString());
  return body.query.search.map((s) => s.title);
}
