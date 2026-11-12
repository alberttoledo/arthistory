import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../store.ts";
import { download, getJson } from "./fetch.ts";
import { searchMet } from "./met.ts";

export interface Candidate {
  /** asset source string, e.g. "wikimedia:File:Foo.jpg" or "met:436105" */
  source: string;
  title: string;
  width: number;
  height: number;
  license: string;
  thumb: string;
}

/** Licenses we can publish with a credit line. */
const OK_LICENSE = /^(public domain|pd|cc0|cc by(-sa)? \d|cc by(-sa)?$|no restrictions)/i;
const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

interface WikiPage {
  title: string;
  imageinfo?: { width: number; height: number; thumburl?: string; mime: string; extmetadata?: Record<string, { value: string }> }[];
}

/**
 * Commons search needs every word to match, so a precise query often finds nothing.
 * Try the full query, then progressively shorter ones (dropping words from the end).
 */
export async function wikimediaCandidates(query: string, limit = 6, minWidth = 900): Promise<Candidate[]> {
  const words = query.split(/\s+/).filter(Boolean);
  const tries = [words.length, 5, 4, 3, 2].filter((n, i, a) => n <= words.length && a.indexOf(n) === i);
  const seen = new Map<string, Candidate>();
  for (const n of tries) {
    for (const c of await searchCommons(words.slice(0, n).join(" "), limit, minWidth)) seen.set(c.source, c);
    if (seen.size >= 3) break;
  }
  return [...seen.values()].slice(0, limit);
}

async function searchCommons(query: string, limit: number, minWidth: number): Promise<Candidate[]> {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query", generator: "search", gsrsearch: `${query} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "20",
    prop: "imageinfo", iiprop: "size|mime|extmetadata|url", iiurlwidth: "480", format: "json",
  }).toString();
  const body = await getJson<{ query?: { pages: Record<string, WikiPage & { index: number }> } }>(api.toString());
  const pages = Object.values(body.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  const out: Candidate[] = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/^image\/(jpeg|png|tiff)/.test(ii.mime) || ii.width < minWidth) continue;
    const license = strip(ii.extmetadata?.LicenseShortName?.value);
    if (!OK_LICENSE.test(license)) continue;
    out.push({ source: `wikimedia:${p.title}`, title: p.title.replace(/^File:/, ""), width: ii.width, height: ii.height, license, thumb: ii.thumburl ?? "" });
    if (out.length >= limit) break;
  }
  return out;
}

export async function metCandidates(query: string, limit = 4): Promise<Candidate[]> {
  const objs = await searchMet(query, limit * 2);
  return objs.filter((o) => o.isPublicDomain && o.primaryImage).slice(0, limit).map((o) => ({
    source: `met:${o.objectID}`, title: `${o.title} — ${o.artistDisplayName} ${o.objectDate}`.trim(),
    width: 0, height: 0, license: "Public domain", thumb: o.primaryImage.replace("/original/", "/web-large/"),
  }));
}

/** Download candidate thumbnails into .cache/thumbs so the model can look at them. */
export async function fetchThumbs(cands: Candidate[]): Promise<string[]> {
  const dir = path.join(ROOT, ".cache", "thumbs");
  fs.mkdirSync(dir, { recursive: true });
  return Promise.all(cands.map(async (c) => {
    const file = path.join(dir, createHash("sha1").update(c.thumb).digest("hex").slice(0, 16) + ".jpg");
    if (!fs.existsSync(file)) await download(c.thumb, file);
    return file;
  }));
}
