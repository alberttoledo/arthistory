import fs from "node:fs";
import { notFound } from "next/navigation";
import {
  buildPreviewProps, episodeFiles, getChannel, getEpisode, listSeries, readAssetManifest,
} from "@cf/core";
import { episodeMedia } from "@/lib/data";
import { EpisodeEditor } from "./EpisodeEditor";

export default async function EpisodePage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const files = episodeFiles(slug, id);
  if (!fs.existsSync(files.dir)) notFound();
  const channel = getChannel(slug);
  const episode = getEpisode(slug, id);
  const media = episodeMedia(episode);
  const preview = buildPreviewProps(slug, id, media.base);
  const read = (f: string, fallback = "") => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : fallback);
  const manifest = fs.existsSync(files.assetManifest) ? readAssetManifest(slug, id) : {};
  return (
    <EpisodeEditor
      channel={{ slug, name: channel.name, hashtags: channel.hashtags }}
      episode={episode}
      series={listSeries(slug).map((s) => ({ id: s.id, name: s.name }))}
      files={{ script: read(files.script), scenes: read(files.scenes, '{ "scenes": [] }'), assets: read(files.assetSpecs, "{}") }}
      images={Object.entries(manifest).map(([key, a]) => ({ key, url: `${media.base}/${a.file}`, credit: a.credit, width: a.width, height: a.height }))}
      preview={preview}
      video={media.video ? `${media.video}?t=${media.renderedAt}` : null}
      post={read(`${files.rendersDir}/post.txt`)}
    />
  );
}
