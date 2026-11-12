import { asset, carousels } from "@/lib/data";
import { CopyButton } from "@/components/CopyButton";

export const metadata = { title: "Brand" };

const THEMES = [
  { name: "Gallery", note: "Default for every slide.", bg: "#0d0b09", fg: "#f3ead8", em: "#d4af37", tokens: [
    ["ground", "#0d0b09", "Slide background"], ["ground-raised", "#17130f", "Panels, tag plates, phone frame"], ["text", "#f3ead8", "Headlines and copy (17:1)"],
    ["text-muted", "#8a7f6c", "Captions, label metadata (4.8:1)"], ["accent", "#d4af37", "The emphasised word, kickers, dates (9:1)"], ["gilt", "#d4af37", "Frames, rings, loupes, leader lines"],
    ["gilt-dim", "#8f7426", "Timeline spine, quiet rules"], ["oxblood", "#7a2318", "The twist, at most once a slide"], ["on-gilt", "#0d0b09", "Text on gold buttons and badges"]] },
  { name: "Paper", note: "One or two slides per carousel: quote, timeline, the “look again” beat.", bg: "#f3ead8", fg: "#0d0b09", em: "#7a2318", tokens: [
    ["ground", "#f3ead8", "Slide background"], ["ground-raised", "#e6dac2", "Raised panels"], ["text", "#0d0b09", "Headlines and copy (17:1)"],
    ["text-muted", "#6f6453", "Captions (5:1). Not #8a7f6c: too faint on cream"], ["accent", "#7a2318", "The emphasised word, kickers, dates (8:1)"], ["gilt", "#d4af37", "Frame lines only, never text (1.9:1)"]] },
];
const FAMILIES = [
  { name: "Cormorant Garamond", role: "Display", use: "Hooks, headlines, quotes, numbers", v: "var(--font-display)", g: "Aa" },
  { name: "Newsreader", role: "Body", use: "Story copy, ledes, captions", v: "var(--font-body)", g: "Aa" },
  { name: "IBM Plex Mono", role: "Labels", use: "Kickers, header, footer, tags (uppercase)", v: "var(--font-mono)", g: "AA" },
];
type Style = { name: string; spec: string; use: string; px: number; css: React.CSSProperties; sample: React.ReactNode };
const D = "var(--font-display)", B = "var(--font-body)", M = "var(--font-mono)";
const STYLES: Style[] = [
  { name: "hero", spec: "Cormorant 500 · 132px · lh .9", use: "Cover hook only", px: 132, css: { fontFamily: D, fontWeight: 500, lineHeight: 0.9 }, sample: <>Its famous name is a <em>mistake</em>.</> },
  { name: "headline-m", spec: "Cormorant 500 · 70px · lh 1", use: "Story slides, 9 words max", px: 70, css: { fontFamily: D, fontWeight: 500, lineHeight: 1 }, sample: <>She isn’t a guest. She’s a <em>logo</em>.</> },
  { name: "headline-s", spec: "Cormorant 600 · 46px · lh 1.08", use: "Dense slides", px: 46, css: { fontFamily: D, fontWeight: 600, lineHeight: 1.08 }, sample: <>Four people, all <em>alone</em> together.</> },
  { name: "quote", spec: "Cormorant italic 500 · 74px", use: "Real, sourced quotes only", px: 74, css: { fontFamily: D, fontWeight: 500, fontStyle: "italic", lineHeight: 1.06 }, sample: <>One of you shall betray me.</> },
  { name: "numeral", spec: "Cormorant 500 · 330px · lh .8", use: "One giant number on a fact slide", px: 330, css: { fontFamily: D, fontWeight: 500, lineHeight: 0.8, color: "var(--gold)" }, sample: <>1797</> },
  { name: "lede", spec: "Newsreader 400 · 38px · lh 1.38", use: "The line under the cover hook", px: 38, css: { fontFamily: B, lineHeight: 1.38 }, sample: <>And three of its people are missing.</> },
  { name: "copy", spec: "Newsreader 400 · 33px · lh 1.45", use: "45 words max per slide", px: 33, css: { fontFamily: B, lineHeight: 1.45 }, sample: <>Light falls on the captain’s open hand, and its shadow lands on his lieutenant’s coat.</> },
  { name: "caption", spec: "Newsreader italic · 25px", use: "Under images, in text-muted", px: 25, css: { fontFamily: B, fontStyle: "italic", color: "var(--muted)" }, sample: <>Early copy, attributed to Gerrit Lundens</> },
  { name: "kicker", spec: "Plex Mono 500 · 22px · +.22em", use: "Above every headline, accent", px: 22, css: { fontFamily: M, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)" }, sample: <>The glowing girl</> },
  { name: "chrome", spec: "Plex Mono 500 · 19px · +.18em", use: "Header and footer, automatic", px: 19, css: { fontFamily: M, fontWeight: 500, letterSpacing: ".18em", textTransform: "uppercase" }, sample: <><span className="gold">No. 03</span> — The Night Watch · 03 / 10</> },
];
const STRUCTURE: [number, string, string, string][] = [
  [0, "01", "Cover", "Hook on a tight detail crop"], [1, "02", "Plate", "Whole painting + museum label"],
  [4, "03–08", "Story", "One idea per slide: loupe, strip, quote or timeline"], [8, "09", "Look again", "The twist or payoff"], [9, "10", "Watch the film", "Our film’s first frame, Save / Share"],
];
const size = (px: number) => `max(12px, min(${Math.round(px * 0.5)}px, ${Math.min((px * 0.5) / 4, 14).toFixed(1)}vw))`;

export default function Brand() {
  const ex = carousels.find((c) => c.slug.startsWith("03")) ?? carousels[0];
  return (
    <div className="brand">
      <div>
        <div className="mono gold">Brand guide</div>
        <h2 className="bh">A museum <em>after hours</em>.</h2>
        <p className="intro">Gallery-black walls, cream wall-label type, gilt frames, and a docent leaning in to tell you a secret. Everything below is what the carousels use. Slide sizes are canvas pixels on the 1080 × 1350 slide.</p>
      </div>

      <section className="bsec"><header><h3>Colour</h3><span className="mono muted">Two slide themes</span></header>
        <div className="themes">{THEMES.map((t) => (
          <div key={t.name} className="theme-card" style={{ background: t.bg, color: t.fg }}>
            <div className="tname" style={{ color: t.em }}>{t.name}</div>
            <div className="demo-h">Someone else is in this <em style={{ color: t.em }}>room</em>.</div>
            <div className="demo-c">{t.note}</div>
            <div className="sw-list">{t.tokens.map(([n, v, u]) => (
              <div key={n} className="sw"><i style={{ background: v }} /><div style={{ minWidth: 0 }}><div className="n">{n} · {v}</div><div className="u">{u}</div></div><CopyButton text={v} /></div>))}
            </div>
          </div>))}
        </div>
      </section>

      <section className="bsec"><header><h3>Typography</h3><span className="mono muted">Google Fonts · free licence</span></header>
        <div className="families">{FAMILIES.map((f) => (
          <div key={f.name} className="fam"><div className="role">{f.role}</div><div className="big" style={{ fontFamily: f.v }}>{f.g}</div>
            <div style={{ fontFamily: f.v, fontSize: 22, fontWeight: 500 }}>{f.name}</div><div className="muted" style={{ fontSize: 14 }}>{f.use}</div></div>))}
        </div>
        <div className="specimens">{STYLES.map((s) => (
          <div key={s.name} className="spec"><div className="meta"><b>{s.name}</b>{s.spec}<br />{s.use}</div>
            <div className="s" style={{ ...s.css, fontSize: size(s.px) }}>{s.sample}</div></div>))}
        </div>
        <p className="mono muted">Specimens shown at half size.</p>
      </section>

      <section className="bsec"><header><h3>Layout</h3><span className="mono muted">1080 × 1350 · Instagram 4:5</span></header>
        <div className="layoutgrid">
          <div className="canvas" role="img" aria-label="Slide safe zones: 120px header, 110px footer, 84px side margins">
            <div className="zone" style={{ left: 0, right: 0, top: 0, height: "8.9%" }} />
            <div className="zone" style={{ left: 0, right: 0, bottom: 0, height: "8.1%" }} />
            <div className="safe" style={{ left: "7.8%", right: "7.8%", top: "8.9%", bottom: "8.1%" }} />
            <div className="lbl" style={{ left: "7.8%", top: "3.5%" }}>Header · 120px</div>
            <div className="lbl" style={{ left: "7.8%", bottom: "3%" }}>Footer · 110px</div>
            <div className="lbl gold" style={{ left: "12%", top: "48%" }}>Text lives here</div>
          </div>
          <ul className="rules">
            <li><b>Margins:</b> text stays 84px from each side, below the 120px header zone and above the 110px footer zone.</li>
            <li><b>Chrome on every slide:</b> “No. 0X — Title” and “03 / 10” at the top; @arthistory and progress dots at the bottom. It’s added automatically.</li>
            <li><b>Text over photos</b> sits at the bottom on a black shade so it stays readable. Never centre body copy.</li>
            <li><b>Square corners</b> everywhere. Circles only for markers, loupes and numbered badges. The CTA phone is the only rounded rectangle (46px).</li>
            <li><b>Texture:</b> film grain (14%) and a soft vignette over every slide.</li>
            <li><b>Mix it up:</b> no slide type twice in a row; one or two paper slides per carousel.</li>
          </ul>
        </div>
      </section>

      {ex && <section className="bsec"><header><h3>The 10-slide story</h3><span className="mono muted">Example: {ex.title}</span></header>
        <div className="structure">{STRUCTURE.map(([i, n, t, d]) => (
          <figure key={n}><img src={asset(ex.renders[Math.min(i, ex.renders.length - 1)])} alt={`${t} slide example`} loading="lazy" />
            <figcaption><b>{n} {t}</b><br />{d}</figcaption></figure>))}
        </div>
        <p className="intro">Every carousel uses at least one loupe (a ringed detail joined to a big circular close-up), one strip or cut-up collage, and one quote, fact or timeline.</p>
      </section>}

      <section className="bsec"><header><h3>Voice</h3><span className="mono muted">A docent whispering a secret</span></header>
        <ul className="rules">
          <li><b>Hooks make people curious; they never summarise.</b> 4–8 words on the cover, 9 words max for any headline.</li>
          <li><b>45 words max</b> of body copy per slide. One idea per slide. Short sentences.</li>
          <li><b>One emphasised word</b> per headline, in italic gold (oxblood on paper).</li>
          <li><b>Every headline gets a kicker:</b> 2–4 uppercase words above it.</li>
          <li><b>Facts must be true.</b> Hedge contested claims (“historians think…”). Never invent a quote.</li>
          <li><b>Images:</b> the painting itself, cropped hard; supporting images only from public-domain or CC sources, logged in sources.md. No AI images except our film’s first frame on the last slide.</li>
          <li>“We” for the channel, “you” for the reader. No emoji on slides.</li>
        </ul>
        <div className="tablewrap"><table className="hooks"><thead><tr><th>No.</th><th>Painting</th><th>Hook</th></tr></thead><tbody>
          {carousels.map((c) => <tr key={c.slug}><td className="mono gold">{c.no}</td><td>{c.title}</td><td className="h">{c.slides[0]?.headline || c.hook}</td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  );
}
