"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EpisodeProps } from "@cf/core/episode-props.ts";
import { ParticleKind, TransitionName, type Style } from "@cf/core/schemas.ts";
import { FONTS } from "@cf/video/theme.tsx";
import { restorePreviousStyle, saveStyle, startChannelJob } from "@/app/actions";
import { EpisodePlayer } from "@/components/EpisodePlayer";
import { useJobs } from "@/components/useJobs";

// Suggestions only: any Google Fonts family name works.
const FONT_SUGGESTIONS = [...new Set([...Object.keys(FONTS),
  "Instrument Serif", "Bricolage Grotesque", "Newsreader", "EB Garamond", "Archivo", "Unbounded", "Young Serif", "Gloock",
  "DM Sans", "Manrope", "Sora", "Outfit", "Bodoni Moda", "Spectral", "Crimson Pro", "Literata", "Work Sans", "Rubik",
  "Josefin Sans", "Abril Fatface", "Prata", "Marcellus", "Caveat", "Permanent Marker", "Space Mono", "JetBrains Mono",
])].sort();

interface Props {
  slug: string;
  initial: Style;
  previewProps: EpisodeProps;
  rationale: { at: string; rationale: string; moodboard: string | null } | null;
  hasPrevious: boolean;
  latestMoodboard: string | null;
}

/** Edit style.json with an instant preview on a real episode. */
export function StyleEditor({ slug, initial, previewProps, rationale, hasPrevious, latestMoodboard }: Props) {
  const [style, setStyle] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const jobs = useJobs((j) => j.channel === slug && j.kind === "style");
  const generating = jobs.find((j) => j.state === "queued" || j.state === "running");
  const lastJob = jobs[0];
  const dirty = JSON.stringify(style) !== JSON.stringify(initial);

  // A finished "Generate style" job rewrites style.json on disk; pick it up — but only when the saved
  // style actually changed, so unrelated refreshes don't wipe unsaved edits.
  const savedKey = JSON.stringify(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setStyle(initial); }, [savedKey]);

  const set = <K extends keyof Style>(k: K, patch: Partial<Style[K]>) =>
    setStyle((s) => ({ ...s, [k]: { ...(s[k] as object), ...patch } }));

  const toggleTransition = (t: TransitionName) => {
    const has = style.motion.transitions.includes(t);
    const next = has ? style.motion.transitions.filter((x) => x !== t) : [...style.motion.transitions, t];
    if (next.length) set("motion", { transitions: next });
  };

  const save = () => start(async () => {
    const r = await saveStyle(slug, style);
    setMsg(r.ok ? "Style saved. New renders use it." : r.error);
    if (r.ok) router.refresh();
  });

  const generate = () => start(async () => {
    // Save the brief first so the generator reads what's on screen.
    const saved = await saveStyle(slug, style);
    if (!saved.ok) return setMsg(saved.error);
    const r = await startChannelJob("style", slug);
    setMsg(r.ok ? null : r.error);
  });

  return (
    <div className="style-grid">
      <div className="stack style-preview">
        <EpisodePlayer props={{ ...previewProps, style }} loop />
        <p className="small faint">The preview updates as you change settings. Save to use them in renders.</p>
      </div>

      <div className="stack" style={{ gap: 22 }}>
        <section className="panel pad stack">
          <div className="spread"><h3>Direction</h3><span className="small faint">{style.moodboardVersion ? `Last generated from moodboard ${style.moodboardVersion}` : "Not generated yet"}</span></div>
          <label className="field">Visual style
            <textarea className="prose" rows={4} value={style.brief.visual} onChange={(e) => set("brief", { visual: e.target.value })}
              placeholder="Colors, typography, imagery, composition, mood. e.g. Faded 1970s travel posters, sun-bleached colors, big condensed type, lots of sky." />
          </label>
          <label className="field">Motion, effects and transitions
            <textarea className="prose" rows={4} value={style.brief.motion} onChange={(e) => set("brief", { motion: e.target.value })}
              placeholder="Pace, camera, transitions, motion blur, layer depth, particles, glow. e.g. Fast whip pans with heavy motion blur, punchy cuts on the beat, parallax depth, embers drifting." />
          </label>
          <div className="row">
            <button className="primary" onClick={generate} disabled={pending || !!generating}>
              {generating ? "Generating style…" : `Generate style from this${latestMoodboard ? ` + moodboard ${latestMoodboard}` : ""}`}
            </button>
            {hasPrevious && !generating && (
              <button className="ghost" disabled={pending} onClick={() => start(async () => { const r = await restorePreviousStyle(slug); setMsg(r.ok ? "Went back to the previous style." : r.error); router.refresh(); })}>
                Go back to previous style
              </button>
            )}
          </div>
          {generating && <p className="small muted">{generating.log.at(-1) ?? "Starting…"}</p>}
          {!generating && lastJob?.state === "failed" && <div className="notice bad">{lastJob.log.slice(-2).join("\n")}</div>}
          {rationale && !generating && <p className="small muted"><span className="faint">Why these settings:</span> {rationale.rationale}</p>}
        </section>

        <section className="panel pad stack">
          <h3>Colors</h3>
          <div className="swatches">
            {(["bg", "fg", "accent", "muted"] as const).map((k) => (
              <label key={k} className="field">
                {{ bg: "Background", fg: "Text", accent: "Accent", muted: "Muted" }[k]}
                <span className="row" style={{ flexWrap: "nowrap", gap: 6 }}>
                  <input type="color" value={style.palette[k]} onChange={(e) => set("palette", { [k]: e.target.value })} />
                  <input value={style.palette[k]} onChange={(e) => set("palette", { [k]: e.target.value })} aria-label={`${k} hex`} style={{ fontSize: 12.5 }} />
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="panel pad stack">
          <h3>Type and captions</h3>
          <datalist id="fonts">{FONT_SUGGESTIONS.map((f) => <option key={f} value={f} />)}</datalist>
          <div className="grid-2" style={{ gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <label className="field">Titles font <span className="faint">(any Google Font)</span>
              <input list="fonts" value={style.fonts.display} onChange={(e) => set("fonts", { display: e.target.value })} />
              <span style={{ fontFamily: `"${style.fonts.display}"`, fontSize: 26, color: "var(--ink)" }}>The great unknown</span>
            </label>
            <label className="field">Captions font <span className="faint">(any Google Font)</span>
              <input list="fonts" value={style.fonts.body} onChange={(e) => set("fonts", { body: e.target.value })} />
              <span style={{ fontFamily: `"${style.fonts.body}"`, fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>Every word in sync</span>
            </label>
            <label className="field">Caption position
              <select value={style.captions.position} onChange={(e) => set("captions", { position: e.target.value as Style["captions"]["position"] })}>
                <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
              </select>
            </label>
            <label className="field">Caption animation
              <select value={style.captions.animation} onChange={(e) => set("captions", { animation: e.target.value as Style["captions"]["animation"] })}>
                <option value="pop">Pop</option><option value="rise">Rise</option><option value="fade">Fade</option><option value="typewriter">Typewriter (word by word)</option><option value="none">None</option>
              </select>
            </label>
            <label className="field">Spoken word highlight
              <select value={style.captions.highlight} onChange={(e) => set("captions", { highlight: e.target.value as Style["captions"]["highlight"] })}>
                <option value="color">Accent color</option><option value="box">Box</option><option value="underline">Underline</option><option value="none">None</option>
              </select>
            </label>
            <label className="field">Words on screen at once
              <input type="number" min={1} max={8} value={style.captions.wordsPerChunk} onChange={(e) => set("captions", { wordsPerChunk: Number(e.target.value) })} />
            </label>
            <label className="field">Caption size
              <input type="number" min={36} max={140} step={2} value={style.captions.size} onChange={(e) => set("captions", { size: Number(e.target.value) })} />
            </label>
            <label className="field">Caption color over images
              <span className="row" style={{ flexWrap: "nowrap" }}>
                <input type="color" value={style.captions.color ?? style.palette.fg} onChange={(e) => set("captions", { color: e.target.value })} />
                {style.captions.color && <button type="button" className="ghost small" onClick={() => set("captions", { color: undefined })}>Use text color</button>}
              </span>
            </label>
          </div>
          <label className="row small"><input type="checkbox" style={{ width: "auto" }} checked={style.captions.uppercase} onChange={(e) => set("captions", { uppercase: e.target.checked })} /> Uppercase captions</label>
        </section>

        <section className="panel pad stack">
          <h3>Motion and transitions</h3>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="small muted" style={{ marginBottom: 6 }}>Transitions, used in rotation</legend>
            <div className="row">
              {TransitionName.options.map((t) => (
                <label key={t} className="row small" style={{ gap: 5 }}>
                  <input type="checkbox" style={{ width: "auto" }} checked={style.motion.transitions.includes(t)} onChange={() => toggleTransition(t)} />{t}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid-2" style={{ gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <Range label="Transition length" value={style.motion.transitionFrames} min={4} max={30} step={1} unit=" frames" onChange={(v) => set("motion", { transitionFrames: v })} />
            <Range label="Motion blur" value={style.effects.motionBlur} onChange={(v) => set("effects", { motionBlur: v })} />
            <Range label="Layer depth (parallax, 3D tilt)" value={style.effects.depth} onChange={(v) => set("effects", { depth: v })} />
            <Range label="Handheld camera" value={style.effects.shake} onChange={(v) => set("effects", { shake: v })} />
          </div>
        </section>

        <section className="panel pad stack">
          <h3>Effects and texture</h3>
          <div className="grid-2" style={{ gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <label className="field">Particles
              <select value={style.effects.particles} onChange={(e) => set("effects", { particles: e.target.value as Style["effects"]["particles"] })}>
                {ParticleKind.options.map((p) => <option key={p} value={p}>{p === "none" ? "None" : p[0].toUpperCase() + p.slice(1)}</option>)}
              </select>
            </label>
            <Range label="Particle amount" value={style.effects.particleAmount} onChange={(v) => set("effects", { particleAmount: v })} />
            <Range label="Light leaks" value={style.effects.lightLeaks} onChange={(v) => set("effects", { lightLeaks: v })} />
            <Range label="Glow on type" value={style.effects.glow} onChange={(v) => set("effects", { glow: v })} />
            <Range label="Chromatic aberration" value={style.effects.chromaticAberration} onChange={(v) => set("effects", { chromaticAberration: v })} />
            <Range label="Film grain" value={style.texture.grain} max={0.6} onChange={(v) => set("texture", { grain: v })} />
            <Range label="Vignette" value={style.texture.vignette} onChange={(v) => set("texture", { vignette: v })} />
            <label className="field">Color tint
              <span className="row" style={{ flexWrap: "nowrap" }}>
                <input type="color" value={style.texture.tint ?? "#000000"} onChange={(e) => set("texture", { tint: e.target.value })} />
                {style.texture.tint && <button type="button" className="ghost small" onClick={() => set("texture", { tint: null })}>Remove</button>}
              </span>
            </label>
          </div>
          <label className="row small"><input type="checkbox" style={{ width: "auto" }} checked={style.progressBar} onChange={(e) => setStyle({ ...style, progressBar: e.target.checked })} /> Progress bar</label>
        </section>

        <div className="row save-bar">
          <button className="primary" disabled={!dirty || pending} onClick={save}>Save style</button>
          {dirty && <button className="ghost" onClick={() => setStyle(initial)}>Discard changes</button>}
          {msg && <span className="small muted">{msg}</span>}
        </div>
      </div>
    </div>
  );
}

function Range({ label, value, min = 0, max = 1, step, unit = "", onChange }: { label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  const s = step ?? (max - min) / 50;
  return (
    <label className="field">
      <span className="spread">{label}<span className="faint">{Number.isInteger(s) ? value : value.toFixed(2)}{unit}</span></span>
      <input type="range" min={min} max={max} step={s} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ padding: 0 }} />
    </label>
  );
}
