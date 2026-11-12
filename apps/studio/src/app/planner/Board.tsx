"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { EpisodeStatus } from "@cf/core/schemas.ts";
import { startJob, updateEpisode } from "@/app/actions";
import { useJobs } from "@/components/useJobs";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/status";

export interface Card {
  channel: string; channelName: string; id: string; title: string; status: EpisodeStatus;
  scheduledFor: string | null; series: string | null; bg: string; accent: string; fg: string;
}
interface Ch { slug: string; name: string; bg: string; accent: string; perWeek: number }

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const key = (c: Pick<Card, "channel" | "id">) => `${c.channel}/${c.id}`;

export function Board({ cards, channels, initialChannel }: { cards: Card[]; channels: Ch[]; initialChannel: string | null }) {
  const [filter, setFilter] = useState<string | null>(initialChannel);
  const [weekOffset, setWeekOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const jobs = useJobs((j) => j.state === "queued" || j.state === "running");
  const busy = new Set(jobs.filter((j) => j.episode).map((j) => `${j.channel}/${j.episode}`));
  const [optimistic, apply] = useOptimistic(cards, (state, patch: { key: string } & Partial<Card>) =>
    state.map((c) => (key(c) === patch.key ? { ...c, ...patch } : c)));

  const visible = optimistic.filter((c) => !filter || c.channel === filter);
  const days = useMemo(() => {
    const monday = new Date(); monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 14 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
  }, [weekOffset]);
  const today = iso(new Date());

  const move = (k: string, patch: Partial<Card>) => {
    const [channel, id] = k.split("/");
    start(async () => {
      apply({ key: k, ...patch });
      const r = await updateEpisode(channel, id, { status: patch.status, scheduledFor: patch.scheduledFor });
      setError(r.ok ? null : r.error);
    });
  };

  const drop = (patch: Partial<Card>) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.currentTarget.classList.add("over"); },
    onDragLeave: (e: React.DragEvent) => e.currentTarget.classList.remove("over"),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); e.currentTarget.classList.remove("over"); move(e.dataTransfer.getData("text/plain"), patch); },
  });

  const CardView = ({ c, compact = false }: { c: Card; compact?: boolean }) => (
    <Link href={`/c/${c.channel}/e/${c.id}`} draggable className={`card${compact ? " compact" : ""}`}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", key(c))}
      style={{ ["--c-bg" as string]: c.bg, ["--c-accent" as string]: c.accent }}>
      <span className="card-ch">{c.channelName}</span>
      <span className="card-title">{c.title}</span>
      {!compact && c.series && <span className="card-meta">{c.series}</span>}
      {!compact && c.scheduledFor && <span className="card-meta">Posts {new Date(c.scheduledFor + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
      {!compact && (c.status === "scripted" || c.status === "planned" || c.status === "voiced") && (
        busy.has(key(c)) ? <span className="card-meta">Making…</span> : (
          <button className="card-make" onClick={(e) => { e.preventDefault(); start(async () => { const r = await startJob("make", c.channel, c.id); setError(r.ok ? null : r.error); }); }}>
            Make video
          </button>
        )
      )}
    </Link>
  );

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="row" role="group" aria-label="Filter by channel">
        <button aria-pressed={!filter} className={!filter ? "primary" : ""} onClick={() => setFilter(null)}>All channels</button>
        {channels.map((ch) => (
          <button key={ch.slug} aria-pressed={filter === ch.slug} className={filter === ch.slug ? "primary" : ""} onClick={() => setFilter(ch.slug)}>
            <span className="chip" style={{ background: ch.bg, ["--chip-accent" as string]: ch.accent }} aria-hidden />{ch.name}
          </button>
        ))}
      </div>
      {error && <div className="notice bad">{error}</div>}

      <section className="stack">
        <div className="spread">
          <h2>Posting calendar</h2>
          <div className="row">
            <button onClick={() => setWeekOffset((w) => w - 1)} aria-label="Earlier week">Earlier</button>
            <button onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>This week</button>
            <button onClick={() => setWeekOffset((w) => w + 1)} aria-label="Later week">Later</button>
          </div>
        </div>
        <div className="calendar">
          {days.map((d) => {
            const day = iso(d);
            const items = visible.filter((c) => c.scheduledFor === day);
            const target = filter ? 1 : channels.length;
            return (
              <div key={day} className={`day${day === today ? " today" : ""}${day < today ? " past" : ""}`} {...drop({ scheduledFor: day })}>
                <div className="day-head">
                  <span>{d.toLocaleDateString("en-US", { weekday: "short" })} {d.getDate()}</span>
                  <span className={items.length >= target ? "full" : "faint"}>{items.length}/{target}</span>
                </div>
                {items.map((c) => <CardView key={key(c)} c={c} compact />)}
              </div>
            );
          })}
        </div>
      </section>

      <section className="stack">
        <h2>Pipeline</h2>
        <ol className="kanban">
          {EpisodeStatus.options.map((st) => {
            const col = visible.filter((c) => c.status === st);
            return (
              <li key={st} className="col" {...drop({ status: st })}>
                <div className="col-head"><span className="status" style={{ ["--s" as string]: STATUS_COLOR[st] }}><i />{STATUS_LABEL[st]}</span><span className="faint">{col.length}</span></div>
                {col.map((c) => <CardView key={key(c)} c={c} />)}
              </li>
            );
          })}
        </ol>
        <div className="drop-unschedule faint small" {...drop({ scheduledFor: null })}>Drop here to unschedule</div>
      </section>
    </div>
  );
}
