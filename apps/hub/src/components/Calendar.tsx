"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { dayKey, fmtShort } from "@/lib/time";

export type CalItem = { at: string; status: "planned" | "published"; role: string; title: string; href: string };
const pad = (n: number) => String(n).padStart(2, "0");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function Calendar({ items }: { items: CalItem[] }) {
  const today = new Date();
  const first = items.map((i) => i.at).sort().find((a) => a.slice(0, 7) >= `${today.getFullYear()}-${pad(today.getMonth() + 1)}`);
  const [ym, setYm] = useState(() => (first ? [Number(first.slice(0, 4)), Number(first.slice(5, 7)) - 1] : [today.getFullYear(), today.getMonth()]));
  const [y, m] = ym;
  const byDay = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    for (const i of [...items].sort((a, b) => a.at.localeCompare(b.at))) map.set(dayKey(i.at), [...(map.get(dayKey(i.at)) ?? []), i]);
    return map;
  }, [items]);
  const lead = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const go = (d: number) => setYm(([yy, mm]) => { const t = new Date(Date.UTC(yy, mm + d, 1)); return [t.getUTCFullYear(), t.getUTCMonth()]; });
  const monthItems = items.filter((i) => i.at.startsWith(`${y}-${pad(m + 1)}`)).sort((a, b) => a.at.localeCompare(b.at));
  const upcoming = items.filter((i) => i.at.slice(0, 10) >= todayKey).sort((a, b) => a.at.localeCompare(b.at)).slice(0, 8);

  const Item = ({ i }: { i: CalItem }) => (
    <Link href={i.href} className={`cal-item role-${i.role}${i.status === "published" ? " is-pub" : ""}`}>
      <span className="t mono">{i.at.slice(11, 16)}</span> {i.title}
    </Link>
  );
  return (
    <div className="cal">
      <div className="cal-bar">
        <button className="mono" onClick={() => go(-1)} aria-label="Previous month">←</button>
        <h3>{MONTHS[m]} {y}</h3>
        <button className="mono" onClick={() => go(1)} aria-label="Next month">→</button>
        <span className="legend mono"><i className="role-teaser" />Teaser <i className="role-film" />Film <i className="role-carousel" />Carousel</span>
      </div>
      <div className="cal-grid" role="grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="cal-dow mono">{d}</div>)}
        {Array.from({ length: lead }, (_, i) => <div key={`l${i}`} className="cal-day blank" />)}
        {Array.from({ length: days }, (_, i) => {
          const key = `${y}-${pad(m + 1)}-${pad(i + 1)}`;
          return <div key={key} className={`cal-day${key === todayKey ? " today" : ""}`}><span className="d mono">{i + 1}</span>{(byDay.get(key) ?? []).map((it, k) => <Item key={k} i={it} />)}</div>;
        })}
      </div>
      <div className="cal-agenda">
        <h4 className="mono muted">{MONTHS[m]} {y}</h4>
        {monthItems.length ? monthItems.map((i, k) => <div key={k} className="agenda-row"><span className="mono">{fmtShort(i.at)}</span><Item i={i} /></div>)
          : <p className="muted">No posts this month.</p>}
      </div>
      <div className="upcoming">
        <h4 className="mono muted">Upcoming</h4>
        {upcoming.length ? upcoming.map((i, k) => <div key={k} className="agenda-row"><span className="mono">{fmtShort(i.at)}</span><Item i={i} /></div>)
          : <p className="muted">No posts scheduled yet.</p>}
      </div>
    </div>
  );
}
