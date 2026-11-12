import Link from "next/link";
import { readFollowers } from "@cf/core";
import { allSummaries, compact, latestMetrics, PROJECT_START } from "@/lib/data";
import { FollowerForm } from "./FollowerForm";

const DAY = 86400000;

/** Followers over time against the straight-line pace needed to hit the goal. */
function PaceChart({ log, goal, deadline, color }: { log: { date: string; followers: number }[]; goal: number; deadline: string; color: string }) {
  const W = 300, H = 120, P = 4;
  const t0 = new Date(PROJECT_START).getTime(), t1 = new Date(deadline).getTime();
  const max = Math.max(goal, ...log.map((l) => l.followers));
  const x = (d: string) => P + ((new Date(d).getTime() - t0) / (t1 - t0)) * (W - 2 * P);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const today = Math.min(1, Math.max(0, (Date.now() - t0) / (t1 - t0)));
  const pts = [{ date: PROJECT_START, followers: 0 }, ...log];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Followers: ${log.at(-1)?.followers ?? 0} of ${goal}`}>
      <line x1={P} y1={y(0)} x2={W - P} y2={y(goal)} stroke="var(--ink-3)" strokeDasharray="4 4" strokeWidth={1} />
      <line x1={P + today * (W - 2 * P)} y1={P} x2={P + today * (W - 2 * P)} y2={H - P} stroke="var(--line)" strokeWidth={1} />
      <polyline points={pts.map((p) => `${x(p.date)},${y(p.followers)}`).join(" ")} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      {log.length > 0 && <circle cx={x(log.at(-1)!.date)} cy={y(log.at(-1)!.followers)} r={3.5} fill={color} />}
    </svg>
  );
}

export default function Analytics() {
  const summaries = allSummaries();
  const posted = summaries.flatMap((s) => s.episodes.filter((e) => e.metrics.length).map((e) => ({ s, e, m: latestMetrics(e)! })))
    .sort((a, b) => (b.m.views ?? 0) - (a.m.views ?? 0));

  // Average views per series and per hook type: what to make more of.
  const groups = new Map<string, { label: string; channel: string; n: number; views: number }>();
  for (const { s, e, m } of posted) {
    for (const [kind, k] of [["Series", e.series ? s.seriesNames[e.series] ?? e.series : null], ["Hook", e.tags.hookType ?? null]] as const) {
      if (!k) continue;
      const id = `${s.channel.slug}/${kind}/${k}`;
      const g = groups.get(id) ?? { label: `${kind}: ${k}`, channel: s.channel.name, n: 0, views: 0 };
      g.n++; g.views += m.views ?? 0;
      groups.set(id, g);
    }
  }
  const ranked = [...groups.values()].map((g) => ({ ...g, avg: g.views / g.n })).sort((a, b) => b.avg - a.avg);

  return (
    <>
      <header className="page-head">
        <div><h1>Analytics</h1><p className="muted">Numbers come from Instagram Insights. Log followers weekly and reel stats a few days after posting.</p></div>
      </header>

      <section className="stack" style={{ gap: 14 }}>
        <h2>Followers against goal pace</h2>
        <p className="small muted">The dashed line is the steady pace that reaches each goal by the deadline.</p>
        <div className="grid-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {summaries.map((s) => {
            const log = readFollowers(s.channel.slug);
            return (
              <article key={s.channel.slug} className="panel pad stack" style={{ gap: 8 }}>
                <div className="spread"><h3>{s.channel.name}</h3><span><strong>{compact(s.followers)}</strong> <span className="faint small">/ {compact(s.channel.goals.followers)}</span></span></div>
                <PaceChart log={log} goal={s.channel.goals.followers} deadline={s.channel.goals.deadline} color={s.style.palette.accent === "#e8c66a" || s.style.palette.accent === "#d4af37" ? "#a37d10" : s.style.palette.accent} />
                <FollowerForm slug={s.channel.slug} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="stack" style={{ marginTop: 34 }}>
        <h2>What’s working</h2>
        {ranked.length === 0 ? <p className="muted">Once reels have stats, series and hook types are ranked here by average views.</p> : (
          <table className="panel">
            <thead><tr><th>Format</th><th>Channel</th><th className="num">Reels</th><th className="num">Avg. views</th></tr></thead>
            <tbody>{ranked.map((g) => <tr key={g.channel + g.label}><td>{g.label}</td><td className="muted">{g.channel}</td><td className="num">{g.n}</td><td className="num">{Math.round(g.avg).toLocaleString()}</td></tr>)}</tbody>
          </table>
        )}
      </section>

      <section className="stack" style={{ marginTop: 34 }}>
        <h2>Reels by views</h2>
        {posted.length === 0 ? <p className="muted">No reel stats yet. Add them on an episode’s Stats tab.</p> : (
          <table className="panel">
            <thead><tr><th>Reel</th><th>Channel</th><th className="num">Views</th><th className="num">Follows</th><th className="num">Saves</th><th className="num">Shares</th><th className="num">Avg. watch</th></tr></thead>
            <tbody>
              {posted.map(({ s, e, m }) => (
                <tr key={s.channel.slug + e.id}>
                  <td><Link href={`/c/${s.channel.slug}/e/${e.id}`}>{e.title}</Link></td>
                  <td className="muted">{s.channel.name}</td>
                  <td className="num">{m.views?.toLocaleString() ?? "–"}</td>
                  <td className="num">{m.follows ?? "–"}</td>
                  <td className="num">{m.saves ?? "–"}</td>
                  <td className="num">{m.shares ?? "–"}</td>
                  <td className="num">{m.avgWatchSeconds != null ? `${m.avgWatchSeconds}s` : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
