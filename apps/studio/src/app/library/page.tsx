import { allSummaries, episodeMedia, latestMetrics } from "@/lib/data";
import { Library, type Reel } from "./Library";

export default function LibraryPage() {
  const reels: Reel[] = allSummaries().flatMap((s) => s.episodes.flatMap((e) => {
    const m = episodeMedia(e);
    if (!m.video) return [];
    return [{
      channel: s.channel.slug, channelName: s.channel.name, id: e.id, title: e.title, status: e.status,
      video: `${m.video}?t=${m.renderedAt}`, cover: m.cover ? `${m.cover}?t=${m.renderedAt}` : null,
      renderedAt: m.renderedAt!, views: latestMetrics(e)?.views ?? null, accent: s.style.palette.accent,
    }];
  })).sort((a, b) => b.renderedAt - a.renderedAt);
  return (
    <>
      <header className="page-head">
        <div><h1>Library</h1><p className="muted">Every rendered reel, newest first.</p></div>
      </header>
      <Library reels={reels} />
    </>
  );
}
