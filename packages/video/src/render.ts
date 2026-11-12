import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { buildEpisodeProps } from "../../core/src/render-props.ts";
import { episodeFiles } from "../../core/src/store.ts";

const entry = path.join(path.dirname(fileURLToPath(import.meta.url)), "index.ts");

export async function renderEpisode(slug: string, id: string, opts: { coverFrame?: number; log?: (s: string) => void } = {}) {
  const log = opts.log ?? console.log;
  const files = episodeFiles(slug, id);
  const inputProps = buildEpisodeProps(slug, id);
  const missing = inputProps.scenes.flatMap((s) => (s.visual.type === "image" && !inputProps.assets[s.visual.asset] ? [s.visual.asset] : []));
  if (missing.length) throw new Error(`Images not downloaded: ${missing.join(", ")}. Run assets first.`);
  fs.mkdirSync(files.rendersDir, { recursive: true });

  log("  bundling…");
  // The episode folder is the public dir, so vo.mp3 and assets/* resolve via staticFile().
  const serveUrl = await bundle({ entryPoint: entry, publicDir: files.dir });
  const composition = await selectComposition({ serveUrl, id: "Episode", inputProps });

  const out = path.join(files.rendersDir, "final.mp4");
  let last = -1;
  await renderMedia({
    composition, serveUrl, inputProps, codec: "h264", outputLocation: out, crf: 18,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) { last = pct; log(`  rendering ${pct}%`); }
    },
  });
  await renderStill({
    composition, serveUrl, inputProps, output: path.join(files.rendersDir, "cover.jpg"),
    frame: Math.min(opts.coverFrame ?? 20, composition.durationInFrames - 1), imageFormat: "jpeg",
  });
  return out;
}
