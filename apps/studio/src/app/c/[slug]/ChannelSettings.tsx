"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Channel } from "@cf/core/schemas.ts";
import { updateChannel } from "@/app/actions";

export function ChannelSettings({ channel }: { channel: Channel }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  return (
    <form className="panel pad stack" style={{ maxWidth: 760 }} action={(f) => start(async () => {
      const r = await updateChannel(channel.slug, {
        name: String(f.get("name")), handle: String(f.get("handle")), niche: String(f.get("niche")),
        audience: String(f.get("audience")), tone: String(f.get("tone")), cadencePerWeek: Number(f.get("cadence")),
        hashtags: String(f.get("hashtags")).split(/[\s,]+/).map((t) => t.replace(/^#/, "")).filter(Boolean),
      });
      setMsg(r.ok ? "Channel saved. New scripts will follow it." : r.error);
      if (r.ok) router.refresh();
    })}>
      <p className="small muted">The script writer reads all of this, so be specific about what the channel is and how it should sound.</p>
      <div className="grid-2" style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <label className="field">Name<input name="name" defaultValue={channel.name} required /></label>
        <label className="field">Instagram handle<input name="handle" defaultValue={channel.handle} required /></label>
      </div>
      <label className="field">What the channel is about<textarea className="prose" name="niche" rows={4} defaultValue={channel.niche} /></label>
      <label className="field">Audience<textarea className="prose" name="audience" rows={2} defaultValue={channel.audience} /></label>
      <label className="field">Voice and tone<textarea className="prose" name="tone" rows={3} defaultValue={channel.tone} /></label>
      <div className="grid-2" style={{ gap: 12, gridTemplateColumns: "2fr 1fr" }}>
        <label className="field">Hashtags added to every post<input name="hashtags" defaultValue={channel.hashtags.map((h) => `#${h}`).join(" ")} /></label>
        <label className="field">Reels per week<input type="number" name="cadence" min={1} max={21} defaultValue={channel.cadencePerWeek} /></label>
      </div>
      <div className="row"><button className="primary" disabled={pending}>Save channel</button>{msg && <span className="small muted">{msg}</span>}</div>
    </form>
  );
}
