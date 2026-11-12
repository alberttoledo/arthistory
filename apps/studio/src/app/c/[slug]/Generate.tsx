"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { startChannelJob, startGenerate } from "@/app/actions";
import { useJobs } from "@/components/useJobs";

const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };

export function Generate({ slug, series, provider, scriptedCount }: { slug: string; series: { id: string; name: string }[]; provider: "api" | "claude-code"; scriptedCount: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<"one" | "series">("one");
  const [seriesMode, setSeriesMode] = useState<string>(series[0]?.id ?? "new");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const jobs = useJobs((j) => j.channel === slug && j.episode === null);
  const active = jobs.find((j) => j.state === "queued" || j.state === "running");
  const last = jobs[0];

  const submit = (f: FormData) => start(async () => {
    const isSeries = kind === "series";
    const chosen = String(f.get("seriesChoice") ?? "");
    const r = await startGenerate(slug, {
      topic: String(f.get("topic") ?? ""),
      count: isSeries ? Number(f.get("count") || 5) : 1,
      series: chosen && chosen !== "new" && chosen !== "none" ? chosen : null,
      newSeries: isSeries && chosen === "new" ? String(f.get("newSeries") || "") || null : null,
      start: f.get("schedule") ? String(f.get("start") || "") || null : null,
      every: Number(f.get("every") || 1),
    });
    if (!r.ok) return setError(r.error);
    setError(null);
    dialog.current?.close();
  });

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row">
        <button className="primary" onClick={() => dialog.current?.showModal()} disabled={!!active}>Generate episodes</button>
        <button onClick={() => start(async () => { await startChannelJob("make-all", slug); })} disabled={!!active || pending || scriptedCount === 0}
          title="Record voice, download images and render every scripted episode">
          Make all {scriptedCount} scripted
        </button>
      </div>
      {active && <p className="small muted">{active.label}: {active.log.at(-1) ?? "starting…"} <Link href="/queue">See progress</Link></p>}
      {!active && last?.state === "failed" && <div className="notice bad">{last.label} failed: {last.log.slice(-3).join("\n")}</div>}
      {!active && last?.state === "done" && last.kind === "generate" && <div className="notice ok">{last.log.at(-1)}</div>}

      <dialog ref={dialog} style={{ width: "min(560px, 94vw)" }}>
        <form className="stack" action={submit}>
          <h2>Generate episodes</h2>
          <div className="row" role="radiogroup" aria-label="What to generate">
            <label className="row small"><input type="radio" style={{ width: "auto" }} checked={kind === "one"} onChange={() => setKind("one")} /> One-off video</label>
            <label className="row small"><input type="radio" style={{ width: "auto" }} checked={kind === "series"} onChange={() => setKind("series")} /> Series</label>
          </div>
          <label className="field">{kind === "one" ? "What is this video about?" : "What is this series about?"}
            <textarea className="prose" name="topic" rows={4} required placeholder={kind === "one" ? "The subject, the angle, anything it must include" : "The thread that ties the episodes together, the people or places to cover"} />
          </label>
          <div className="grid-2" style={{ gap: 10, gridTemplateColumns: kind === "series" ? "1fr 2fr" : "1fr" }}>
            {kind === "series" && <label className="field">Episodes<input type="number" name="count" min={2} max={30} defaultValue={5} /></label>}
            <label className="field">Series
              <select name="seriesChoice" value={seriesMode} onChange={(e) => setSeriesMode(e.target.value)}>
                {kind === "one" && <option value="none">No series</option>}
                {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                {kind === "series" && <option value="new">New series…</option>}
              </select>
            </label>
          </div>
          {kind === "series" && seriesMode === "new" && <label className="field">New series name <span className="faint">(optional, one will be suggested)</span><input name="newSeries" /></label>}
          <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
            <label className="row small"><input type="checkbox" name="schedule" defaultChecked style={{ width: "auto" }} /> Put in the calendar</label>
            <div className="grid-2" style={{ gap: 10, gridTemplateColumns: "1fr 1fr" }}>
              <label className="field">Starting<input type="date" name="start" defaultValue={tomorrow()} /></label>
              {kind === "series" && <label className="field">Every<select name="every" defaultValue="1"><option value="1">day</option><option value="2">2 days</option><option value="3">3 days</option><option value="7">week</option></select></label>}
            </div>
          </fieldset>
          <p className="small faint">
            Writes the script, plans the shots and picks openly licensed pictures. Uses {provider === "api" ? "your Anthropic API key" : "your Claude Code login on this computer"}.
            Takes about a minute per episode. Episodes land as “Scripted”; then make them one by one or all at once.
          </p>
          {error && <div className="notice bad">{error}</div>}
          <div className="row"><button className="primary" disabled={pending}>{kind === "one" ? "Generate episode" : "Generate series"}</button><button type="button" className="ghost" onClick={() => dialog.current?.close()}>Cancel</button></div>
        </form>
      </dialog>
    </div>
  );
}
