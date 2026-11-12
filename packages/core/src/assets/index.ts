import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cropImage, probeSize } from "../media.ts";
import { episodeFiles, readAssetSpecs, ROOT, writeJson } from "../store.ts";
import type { AssetSpec, ResolvedAsset } from "../schemas.ts";
import { download } from "./fetch.ts";
import { met } from "./met.ts";
import { wikimedia } from "./wikimedia.ts";

export interface SourceHit {
  url: string;
  credit: string;
  pageUrl: string;
}

async function lookup(spec: AssetSpec): Promise<SourceHit> {
  const [kind, ...rest] = spec.source.split(":");
  const ref = rest.join(":");
  // A crop needs more source pixels so the detail stays sharp at 1080 wide.
  const width = spec.crop ? Math.min(Math.ceil(spec.maxWidth / spec.crop.w), 12000) : spec.maxWidth;
  switch (kind) {
    case "wikimedia": return wikimedia(ref, width);
    case "met": return met(ref);
    default: throw new Error(`Unknown asset source "${kind}" in ${spec.source}`);
  }
}

/** Download every asset in assets.json into assets/ and write assets/manifest.json. Cached by source. */
export async function resolveAssets(slug: string, id: string, log = console.log) {
  const files = episodeFiles(slug, id);
  const specs = readAssetSpecs(slug, id);
  fs.mkdirSync(files.assetsDir, { recursive: true });
  // Shared across episodes and kept out of the episode folder, which gets bundled for rendering.
  const cacheDir = path.join(ROOT, ".cache", "sources");
  fs.mkdirSync(cacheDir, { recursive: true });
  const prev: Record<string, ResolvedAsset & { spec?: string }> =
    fs.existsSync(files.assetManifest) ? JSON.parse(fs.readFileSync(files.assetManifest, "utf8")) : {};
  const manifest: Record<string, ResolvedAsset & { spec: string }> = {};

  for (const [key, spec] of Object.entries(specs)) {
    const specKey = JSON.stringify(spec);
    const out = path.join(files.assetsDir, `${key}.jpg`);
    if (prev[key]?.spec === specKey && fs.existsSync(out)) {
      manifest[key] = { ...prev[key], spec: specKey };
      continue;
    }
    if (spec.source.startsWith("local:")) {
      const src = path.join(files.dir, spec.source.slice(6));
      cropImage(src, out, spec.maxWidth, spec.crop);
      manifest[key] = { file: `assets/${key}.jpg`, ...probeSize(out), credit: "Original", sourceUrl: "", spec: specKey };
      continue;
    }
    log(`  ↓ ${key} ← ${spec.source}`);
    const hit = await lookup(spec);
    const u = new URL(hit.url);
    const cached = path.join(cacheDir, createHash("sha1").update(u.origin + u.pathname).digest("hex").slice(0, 16) + path.extname(u.pathname));
    if (!fs.existsSync(cached)) await download(hit.url, cached);
    cropImage(cached, out, spec.maxWidth, spec.crop);
    manifest[key] = { file: `assets/${key}.jpg`, ...probeSize(out), credit: hit.credit, sourceUrl: hit.pageUrl, spec: specKey };
  }
  writeJson(files.assetManifest, manifest);
  return manifest;
}
