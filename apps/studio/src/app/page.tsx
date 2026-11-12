import Link from "next/link";
import { EpisodeStatus } from "@cf/core";
import { STATUS_LABEL } from "@/lib/status";
import { allSummaries, compact, dayOfProject, type ChannelSummary } from "@/lib/data";
import "./overview.css";

function Goal({ label, value, goal, s }: { label: string; value: number; goal: number; s: ChannelSummary["style"] }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div className="goal">
      <div className="goal-num"><strong>{compact(value)}</strong> <span>/ {compact(goal)} {label}</span></div>
      <div className="goal-bar" style={{ background: `${s.palette.fg}22` }}>
        <div style={{ width: `${Math.max(pct, 0.6)}%`, background: s.palette.accent }} />
      </div>
    </div>
  );
}

export default function Overview() {
  const summaries = allSummaries();
  const { day, total, deadline } = dayOfProject();
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
  const inWeek = (d: string | null) => !!d && new Date(d) >= weekStart && new Date(d) < weekEnd;
  const all = summaries.flatMap((s) => s.episodes);
  const postedThisWeek = all.filter((e) => inWeek(e.postedAt)).length;
  const weeklyTarget = summaries.reduce((n, s) => n + s.channel.cadencePerWeek, 0);
  const toReview = all.filter((e) => e.status === "rendered");

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Day {day} of {total}</h1>
          <p className="muted">
            {postedThisWeek} of {weeklyTarget} reels posted this week. Goal date: {deadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
          </p>
        </div>
        {toReview.length > 0 && (
          <Link className="btn primary" href={`/c/${toReview[0].channel}/e/${toReview[0].id}`}>
            Review {toReview.length} rendered {toReview.length === 1 ? "reel" : "reels"}
          </Link>
        )}
      </header>

      <section className="lanes" aria-label="Channels">
        {summaries.map((s) => {
          const { palette, fonts } = s.style;
          return (
            <Link key={s.channel.slug} href={`/c/${s.channel.slug}`} className="lane"
              style={{ background: palette.bg, color: palette.fg, ["--lane-muted" as string]: palette.muted, ["--lane-accent" as string]: palette.accent }}>
              <div className="lane-id">
                <span className="lane-name" style={{ fontFamily: `"${fonts.display}", serif` }}>{s.channel.name}</span>
                <span className="lane-handle">{s.channel.handle}</span>
              </div>
              <div className="lane-goals">
                <Goal label="followers" value={s.followers} goal={s.channel.goals.followers} s={s.style} />
                <Goal label="views" value={s.views} goal={s.channel.goals.views} s={s.style} />
              </div>
              <ol className="lane-pipe" aria-label="Episodes by stage">
                {EpisodeStatus.options.map((st) => (
                  <li key={st} className={s.counts[st] ? "has" : ""}>
                    <strong>{s.counts[st]}</strong>
                    <span>{STATUS_LABEL[st]}</span>
                  </li>
                ))}
              </ol>
            </Link>
          );
        })}
      </section>
    </>
  );
}
