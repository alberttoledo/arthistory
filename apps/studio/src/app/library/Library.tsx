"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { EpisodeStatus } from "@cf/core/schemas.ts";
import { StatusDot } from "@/components/StatusDot";

export interface Reel {
  channel: string; channelName: string; id: string; title: string; status: EpisodeStatus;
  video: string; cover: string | null; renderedAt: number; views: number | null; accent: string;
}

export function Library({ reels }: { reels: Reel[] }) {
  const [channel, setChannel] = useState("");
  const [open, setOpen] = useState<Reel | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const channels = [...new Map(reels.map((r) => [r.channel, r.channelName])).entries()];
  const shown = reels.filter((r) => !channel || r.channel === channel);

  if (!reels.length) return <p className="muted">Nothing rendered yet. Open an episode and choose Render video.</p>;
  return (
    <div className="stack" style={{ gap: 18 }}>
      <label className="field" style={{ maxWidth: 240 }}>Channel
        <select value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="">All channels</option>
          {channels.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
        </select>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 16 }}>
        {shown.map((r) => (
          <button key={`${r.channel}/${r.id}`} className="ghost" style={{ padding: 0, flexDirection: "column", alignItems: "stretch", textAlign: "left", fontWeight: 400 }}
            onClick={() => { setOpen(r); dialog.current?.showModal(); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {r.cover ? <img src={r.cover} alt="" style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", borderRadius: 8, display: "block", borderBottom: `3px solid ${r.accent}` }} />
              : <div style={{ aspectRatio: "9/16", background: "var(--line-soft)", borderRadius: 8 }} />}
            <span className="small faint" style={{ marginTop: 8 }}>{r.channelName}</span>
            <span style={{ fontWeight: 600, lineHeight: 1.3 }}>{r.title}</span>
            <span className="spread" style={{ marginTop: 4 }}><StatusDot status={r.status} />{r.views != null && <span className="small muted">{r.views.toLocaleString()} views</span>}</span>
          </button>
        ))}
      </div>
      <dialog ref={dialog} onClose={() => setOpen(null)} style={{ width: "min(400px, 92vw)" }}>
        {open && (
          <div className="stack">
            <video src={open.video} controls autoPlay playsInline style={{ width: "100%", aspectRatio: "9/16", background: "#000", borderRadius: 8 }} />
            <div className="spread">
              <Link className="btn primary" href={`/c/${open.channel}/e/${open.id}`}>Open episode</Link>
              <button onClick={() => dialog.current?.close()}>Close</button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
