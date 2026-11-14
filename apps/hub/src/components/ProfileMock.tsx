"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChannelProfile } from "@/lib/data";

type Base = { key: string; no: string; title: string; role: string; href: string };
export type Tile =
  | (Base & { kind: "carousel"; poster: string; slides: string[]; caption: string; hashtags: string[] })
  | (Base & { kind: "reel"; video: string; poster?: string })
  | (Base & { kind: "missing" });

// Simple line icons, drawn for this mock.
const I = {
  grid: <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18" /></svg>,
  reel: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M3 8h18M8 3l3 5M14 3l3 5M10 12v5l4.5-2.5z" /></svg>,
  stack: <svg viewBox="0 0 24 24"><rect x="7" y="3" width="14" height="14" rx="2" /><path d="M17 21H5a2 2 0 0 1-2-2V7" /></svg>,
  heart: <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z" /></svg>,
  chat: <svg viewBox="0 0 24 24"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.5-5A8.5 8.5 0 1 1 21 12z" /></svg>,
  send: <svg viewBox="0 0 24 24"><path d="M22 3 11 13M22 3l-7 18-4-8-8-4z" /></svg>,
  save: <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V3h14z" /></svg>,
  back: <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>,
  more: <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></svg>,
};

function Avatar({ src, size }: { src: string | null; size: number }) {
  return <span className="pf-av" style={{ width: size, height: size }}>{src ? <img src={src} alt="" /> : null}</span>;
}

function Post({ t, handle, avatar, onBack }: { t: Exclude<Tile, { kind: "missing" }>; handle: string; avatar: string | null; onBack: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);
  const [more, setMore] = useState(false);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    const el = track.current; if (!el) return;
    const on = () => setCur(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  const go = (i: number) => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "smooth" });

  if (t.kind === "reel") return (
    <div className="pf-reel">
      <video src={t.video} poster={t.poster} autoPlay loop playsInline muted={muted} onClick={() => setMuted(!muted)} />
      <span className="pf-mute mono">{muted ? "Tap for sound" : "Sound on"}</span>
      <button className="pf-icon pf-reel-back" onClick={onBack} aria-label="Back to profile">{I.back}</button>
      <div className="pf-reel-meta"><Avatar src={avatar} size={30} /><b>{handle}</b><span className="pf-follow">Follow</span></div>
      <div className="pf-reel-tag mono">No. {t.no} · {t.role}</div>
    </div>
  );

  const n = t.slides.length;
  const tags = t.hashtags.map((h) => "#" + h.replace(/^#/, "")).join(" ");
  return (
    <div className="pf-post">
      <div className="pf-bar"><button className="pf-icon" onClick={onBack} aria-label="Back to profile">{I.back}</button><span className="pf-bar-title">Posts</span><span className="pf-icon" /></div>
      <div className="pf-post-head"><Avatar src={avatar} size={32} /><b>{handle}</b><span className="pf-icon pf-dim">{I.more}</span></div>
      <div className="pf-slides">
        <div className="pf-track" ref={track}>{t.slides.map((s, i) => <img key={s} src={s} alt={`Slide ${i + 1}`} loading={i < 2 ? "eager" : "lazy"} />)}</div>
        <span className="pf-count">{cur + 1}/{n}</span>
        {cur > 0 && <button className="pf-nav l" onClick={() => go(cur - 1)} aria-label="Previous slide">‹</button>}
        {cur < n - 1 && <button className="pf-nav r" onClick={() => go(cur + 1)} aria-label="Next slide">›</button>}
      </div>
      <div className="pf-actions"><span className="pf-icon">{I.heart}</span><span className="pf-icon">{I.chat}</span><span className="pf-icon">{I.send}</span>
        <span className="pf-dots">{t.slides.map((s, i) => <i key={s} className={i === cur ? "on" : ""} />)}</span><span className="pf-icon">{I.save}</span></div>
      <div className="pf-caption">
        {more
          ? <p><b>{handle}</b> {t.caption}<br /><br /><span className="pf-tags">{tags}</span></p>
          : <p><b>{handle}</b> {t.caption.split("\n")[0]}… <button onClick={() => setMore(true)}>more</button></p>}
      </div>
    </div>
  );
}

export function ProfileMock({ handle, profile, avatar, tiles }: { handle: string; profile: ChannelProfile | null; avatar: string | null; tiles: Tile[] }) {
  const [tab, setTab] = useState<"grid" | "reels">("grid");
  const [open, setOpen] = useState<string | null>(null);
  const shown = tab === "grid" ? tiles : tiles.filter((t) => t.kind === "reel");
  const posted = tiles.filter((t) => t.kind !== "missing").length;
  const opened = tiles.find((t) => t.key === open && t.kind !== "missing") as Exclude<Tile, { kind: "missing" }> | undefined;
  const carousels = tiles.filter((t): t is Extract<Tile, { kind: "carousel" }> => t.kind === "carousel");

  return (
    <div className="pf-layout">
      <div className="pf-phone" aria-label="Instagram profile mock">
        {opened ? <Post t={opened} handle={handle} avatar={avatar} onBack={() => setOpen(null)} /> : <>
          <div className="pf-bar"><span className="pf-icon" /><span className="pf-bar-title">{handle}</span><span className="pf-icon">{I.more}</span></div>
          <div className="pf-head">
            <span className="pf-ring"><Avatar src={avatar} size={88} /></span>
            <div className="pf-stats">
              <div><b>{posted}</b><span>posts</span></div><div><b>—</b><span>followers</span></div><div><b>—</b><span>following</span></div>
            </div>
          </div>
          <div className="pf-bio">
            <b>{profile?.name ?? handle}</b>
            {profile?.category && <span className="pf-dim">{profile.category}</span>}
            {profile?.bio.map((l) => <span key={l}>{l}</span>)}
            {profile?.link && <span className="pf-link">{profile.link}</span>}
          </div>
          <div className="pf-btns"><span className="pf-btn primary">Follow</span><span className="pf-btn">Message</span></div>
          <div className="pf-highlights">
            {carousels.slice().reverse().map((c) => <button key={c.key} onClick={() => setOpen(c.key)}><span className="pf-hl"><img src={c.poster} alt="" /></span><span>{c.title}</span></button>)}
          </div>
          <div className="pf-tabs">
            <button aria-pressed={tab === "grid"} onClick={() => setTab("grid")} aria-label="All posts">{I.grid}</button>
            <button aria-pressed={tab === "reels"} onClick={() => setTab("reels")} aria-label="Reels">{I.reel}</button>
          </div>
          <div className="pf-grid">
            {shown.map((t) => t.kind === "missing"
              ? <Link key={t.key} href={t.href} className="pf-tile missing" title={`${t.title} · ${t.role}: no final yet`}><span>No. {t.no}<br />{t.role}<br />not ready</span></Link>
              : <button key={t.key} className="pf-tile" onClick={() => setOpen(t.key)} title={`${t.title} · ${t.role}`}>
                  {t.poster ? <img src={t.poster} alt="" loading="lazy" /> : t.kind === "reel" ? <video src={t.video} muted preload="metadata" /> : null}
                  <span className="pf-kind">{t.kind === "reel" ? I.reel : I.stack}</span>
                </button>)}
          </div>
        </>}
      </div>
    </div>
  );
}
