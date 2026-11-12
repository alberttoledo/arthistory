"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Carousel } from "@/lib/data";
import { asset } from "@/lib/data";

const fileName = (c: Carousel, i: number) => `${c.slug}-${String(i + 1).padStart(2, "0")}.jpg`;

async function toFiles(c: Carousel, idx: number[]) {
  return Promise.all(idx.map(async (i) => {
    const r = await fetch(asset(c.renders[i]));
    if (!r.ok) throw new Error("fetch");
    return new File([await r.blob()], fileName(c, i), { type: "image/jpeg" });
  }));
}

export function Viewer({ c, children }: { c: Carousel; children: React.ReactNode }) {
  const n = c.renders.length;
  const track = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  useEffect(() => {
    try {
      const probe = new File([new Blob(["x"], { type: "image/jpeg" })], "x.jpg", { type: "image/jpeg" });
      setCanShareFiles(!!navigator.canShare?.({ files: [probe] }));
    } catch { setCanShareFiles(false); }
  }, []);

  const go = useCallback((i: number) => {
    const t = track.current; if (!t) return;
    t.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * t.clientWidth, behavior: "smooth" });
  }, [n]);

  useEffect(() => {
    const t = track.current; if (!t) return;
    const onScroll = () => setCur(Math.round(t.scrollLeft / t.clientWidth));
    t.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1); };
    window.addEventListener("keydown", onKey);
    return () => { t.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, [cur, go]);

  // mouse drag to swipe on desktop
  const x0 = useRef<number | null>(null);

  async function share(idx: number[], label: string) {
    setBusy(true); setStatus(`Preparing ${label}…`);
    try {
      const files = await toFiles(c, idx);
      await navigator.share({ files });
      setStatus(idx.length > 1 ? `Shared ${idx.length} slides. Tap “Save ${idx.length} Images” to put them in Photos.` : "Shared. Tap “Save Image” to put it in Photos.");
    } catch (e) {
      setStatus((e as Error)?.name === "AbortError" ? "Cancelled." : "Couldn't open the share sheet. Use Download .zip instead.");
    }
    setBusy(false);
  }

  return (
    <div className="vgrid">
      <div className="phone">
        <div className="top"><div className="avatar">A</div><b>arthistory</b><span className="mono muted" style={{ marginLeft: "auto" }}>Carousel</span></div>
        <div className="stage">
          <div className="track" ref={track}
            onPointerDown={(e) => { if (e.pointerType === "mouse") x0.current = e.clientX; }}
            onPointerUp={(e) => { if (x0.current !== null) { const d = e.clientX - x0.current; if (Math.abs(d) > 40) go(cur + (d < 0 ? 1 : -1)); x0.current = null; } }}>
            {c.renders.map((r, i) => <img key={r} src={asset(r)} alt={c.slides[i]?.alt || `Slide ${i + 1}`} draggable={false} />)}
          </div>
          <button className="arrow l" aria-label="Previous slide" disabled={cur === 0} onClick={() => go(cur - 1)}>‹</button>
          <button className="arrow r" aria-label="Next slide" disabled={cur === n - 1} onClick={() => go(cur + 1)}>›</button>
          <div className="count">{cur + 1} / {n}</div>
        </div>
        <div className="pips">{c.renders.map((r, i) => <i key={r} className={i === cur ? "on" : ""} />)}</div>
        <div className="cap"><b>arthistory</b> {c.caption}</div>
      </div>

      <div className="info">
        <div className="no mono">No. {c.no} · {c.videoFormat}</div>
        <h2>{c.title}</h2>
        <div className="meta">{c.artist} · {c.year} · {c.museum}</div>
        {c.hook && <div className="hook">{c.hook}</div>}

        <div className="section save">
          <h3 className="mono">Save the slides</h3>
          <div className="btns mono">
            {canShareFiles && <button className="primary" disabled={busy} onClick={() => share(c.renders.map((_, i) => i), `${n} slides`)}>Save all {n} to Photos</button>}
            <a className={canShareFiles ? "" : "primary"} href={asset(c.zip)} download>Download .zip</a>
            {canShareFiles
              ? <button disabled={busy} onClick={() => share([cur], `slide ${cur + 1}`)}>Save this slide</button>
              : <a href={asset(c.renders[cur])} download={fileName(c, cur)}>Download this slide</a>}
          </div>
          <div className="status" role="status" aria-live="polite">{status}</div>
          <p className="hint">{canShareFiles
            ? "“Save all to Photos” opens the share sheet: choose Save Images and they land in Photos in order, 01 first. The zip also includes caption.txt."
            : "The zip holds all slides in order plus caption.txt with the caption and hashtags. On a phone, “Save all to Photos” appears when the browser supports it."}</p>
        </div>

        <div className="section"><h3 className="mono">Slides <span>{n}</span></h3>
          <div className="strip">{c.renders.map((r, i) => (
            <button key={r} className={i === cur ? "on" : ""} aria-label={`Go to slide ${i + 1}`} onClick={() => go(i)}>
              <img src={asset(r)} alt="" loading="lazy" /><span>{String(i + 1).padStart(2, "0")}</span>
            </button>))}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
