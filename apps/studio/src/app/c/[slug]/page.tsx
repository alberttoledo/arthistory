import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aiProvider, buildPreviewProps, channelDir, getChannel, listMoodboards, listSeries } from "@cf/core";
import { sampleProps } from "@cf/video/sample.ts";
import { StatusDot } from "@/components/StatusDot";
import { Tabs } from "@/components/Tabs";
import { channelSummary, compact, episodeMedia, latestMetrics } from "@/lib/data";
import { ChannelSettings } from "./ChannelSettings";
import { Generate } from "./Generate";
import { Moodboards } from "./Moodboards";
import { StyleEditor } from "./StyleEditor";
import "./channel.css";

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!fs.existsSync(`${channelDir(slug)}/channel.json`)) notFound();
  const channel = getChannel(slug);
  const summary = channelSummary(channel);
  const { style } = summary;
  const series = listSeries(slug);
  const boards = listMoodboards(slug);
  const rationaleFile = path.join(channelDir(slug), "style.rationale.json");

  // Preview the style on this channel's most recent episode that can be previewed, else on a sample.
  const previewable = [...summary.episodes].reverse()
    .map((e) => buildPreviewProps(slug, e.id, episodeMedia(e).base).props).find(Boolean);
  const previewProps = previewable ?? { ...sampleProps, style };

  const episodes = (
    <div className="stack" style={{ gap: 18 }}>
      <Generate slug={slug} series={series.map((s) => ({ id: s.id, name: s.name }))} provider={aiProvider()} scriptedCount={summary.counts.scripted} />
      {summary.episodes.length === 0 ? (
        <p className="muted">No episodes yet. Generate a one-off or a whole series above.</p>
      ) : (
        <table className="panel">
          <thead><tr><th>Episode</th><th>Series</th><th>Stage</th><th>Post on</th><th className="num">Views</th></tr></thead>
          <tbody>
            {[...summary.episodes].reverse().map((e) => (
              <tr key={e.id}>
                <td><Link href={`/c/${slug}/e/${e.id}`}>{e.title}</Link>{e.tags.part && <span className="faint small"> · part {e.tags.part}</span>}</td>
                <td className="muted">{e.series ? summary.seriesNames[e.series] ?? e.series : "–"}</td>
                <td><StatusDot status={e.status} /></td>
                <td className="muted">{e.scheduledFor ?? "–"}</td>
                <td className="num">{latestMetrics(e)?.views != null ? compact(latestMetrics(e)!.views!) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h2 style={{ marginTop: 12 }}>Series</h2>
      <div className="series">
        {series.map((s) => (
          <article key={s.id} className="panel pad stack">
            <div className="spread"><h3>{s.name}</h3><span className="small faint">about {s.targetSeconds}s</span></div>
            <p className="muted">{s.premise}</p>
            <p className="small"><span className="faint">Hook:</span> {s.hookFormula}</p>
            <ol className="small muted structure">{s.structure.map((b) => <li key={b}>{b}</li>)}</ol>
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <header className="channel-head" style={{ background: style.palette.bg, color: style.palette.fg, ["--accent" as string]: style.palette.accent }}>
        <div>
          <h1 style={{ fontFamily: `"${style.fonts.display}", serif` }}>{channel.name}</h1>
          <p style={{ fontFamily: `"${style.fonts.body}", sans-serif` }}>{channel.niche.split(". ")[0]}.</p>
        </div>
        <dl className="channel-facts">
          <div><dt>Followers</dt><dd>{compact(summary.followers)}</dd></div>
          <div><dt>Views</dt><dd>{compact(summary.views)}</dd></div>
          <div><dt>Episodes</dt><dd>{summary.episodes.length}</dd></div>
          <div><dt>Voice</dt><dd>{channel.voice.provider === "say" ? `${channel.voice.voice} (temporary)` : channel.voice.voice}</dd></div>
        </dl>
      </header>
      <Tabs tabs={[
        { id: "episodes", label: "Episodes", panel: episodes },
        {
          id: "look", label: "Look and feel", panel: (
            <StyleEditor slug={slug} initial={style} previewProps={previewProps}
              rationale={fs.existsSync(rationaleFile) ? JSON.parse(fs.readFileSync(rationaleFile, "utf8")) : null}
              hasPrevious={fs.existsSync(path.join(channelDir(slug), "style.previous.json"))}
              latestMoodboard={boards[0]?.images.length ? boards[0].version : null} />
          ),
        },
        { id: "moodboard", label: `Moodboard${boards[0]?.images.length ? ` (${boards[0].images.length})` : ""}`, panel: <Moodboards slug={slug} boards={boards.map(({ dir: _dir, ...b }) => b)} styleVersion={style.moodboardVersion} /> },
        { id: "channel", label: "Channel", panel: <ChannelSettings channel={channel} /> },
      ]} />
    </>
  );
}
