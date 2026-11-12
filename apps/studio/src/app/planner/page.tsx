import { allSummaries } from "@/lib/data";
import { Board, type Card } from "./Board";
import "./planner.css";

export default async function Planner({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const { channel } = await searchParams;
  const summaries = allSummaries();
  const cards: Card[] = summaries.flatMap((s) => s.episodes.map((e) => ({
    channel: s.channel.slug, channelName: s.channel.name, id: e.id, title: e.title, status: e.status,
    scheduledFor: e.scheduledFor, series: e.series ? s.seriesNames[e.series] ?? e.series : null,
    bg: s.style.palette.bg, accent: s.style.palette.accent, fg: s.style.palette.fg,
  })));
  return (
    <>
      <header className="page-head">
        <div>
          <h1>Planner</h1>
          <p className="muted">Drag a reel to a day to schedule it, or to a column to change its stage.</p>
        </div>
      </header>
      <Board cards={cards} channels={summaries.map((s) => ({ slug: s.channel.slug, name: s.channel.name, bg: s.style.palette.bg, accent: s.style.palette.accent, perWeek: s.channel.cadencePerWeek }))} initialChannel={channel ?? null} />
    </>
  );
}
