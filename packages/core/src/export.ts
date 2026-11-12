import fs from "node:fs";
import path from "node:path";
import { episodeFiles, getChannel, getEpisode, readAssetManifest } from "./store.ts";

/** Write renders/post.txt: everything needed to post by hand. */
export function writePostPackage(slug: string, id: string) {
  const channel = getChannel(slug);
  const ep = getEpisode(slug, id);
  const files = episodeFiles(slug, id);
  const credits = Object.values(readAssetManifest(slug, id)).map((a) => a.credit).filter((c) => c !== "Original");
  const tags = [...new Set([...ep.hashtags, ...channel.hashtags])].map((t) => (t.startsWith("#") ? t : `#${t}`));
  const text = [
    ep.caption,
    "",
    tags.join(" "),
    "",
    credits.length ? `Images: ${[...new Set(credits)].join("; ")}` : "",
  ].join("\n").trim() + "\n";
  const out = path.join(files.rendersDir, "post.txt");
  fs.mkdirSync(files.rendersDir, { recursive: true });
  fs.writeFileSync(out, text);
  return out;
}
