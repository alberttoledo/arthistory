"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PreviewResult } from "@cf/core/render-props.ts";
import { EpisodeStatus, type Episode } from "@cf/core/schemas.ts";
import { saveEpisodeFiles, startJob, updateEpisode, addMetrics, type Result } from "@/app/actions";
import { EpisodePlayer } from "@/components/EpisodePlayer";
import { StatusDot } from "@/components/StatusDot";
import { useJobs } from "@/components/useJobs";
import { STATUS_LABEL } from "@/lib/status";
import "./editor.css";

interface Props {
  channel: { slug: string; name: string; hashtags: string[] };
  episode: Episode;
  series: { id: string; name: string }[];
  files: { script: string; scenes: string; assets: string };
  images: { key: string; url: string; credit: string; width: number; height: number }[];
  preview: PreviewResult;
  video: string | null;
  post: string;
}

type Tab = "script" | "scenes" | "images" | "post" | "stats";
const TABS: [Tab, string][] = [["script", "Script"], ["scenes", "Scenes"], ["images", "Images"], ["post", "Post"], ["stats", "Stats"]];

export function EpisodeEditor({ channel, episode, series, files, images, preview, video, post }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("script");
  const [script, setScript] = useState(files.script);
  const [scenes, setScenes] = useState(files.scenes);
  const [assets, setAssets] = useState(files.assets);
  const [view, setView] = useState<"preview" | "render">(video ? "render" : "preview");
  const [message, setMessage] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const jobs = useJobs((j) => j.channel === channel.slug && j.episode === episode.id);
  const active = jobs.find((j) => j.state === "queued" || j.state === "running");
  const lastJob = jobs[0];

  const dirty = script !== files.script || scenes !== files.scenes || assets !== files.assets;

  const run = (fn: () => Promise<Result>, okText: string) =>
    start(async () => {
      const r = await fn();
      setMessage(r.ok ? { kind: "ok", text: okText } : { kind: "bad", text: r.error });
      if (r.ok) router.refresh();
    });

  const save = () => run(() => saveEpisodeFiles(channel.slug, episode.id, { script, scenes, assets }), "Saved. The preview is up to date.");

  const job = (kind: "voice" | "assets" | "render" | "make") =>
    start(async () => {
      if (dirty) {
        const r = await saveEpisodeFiles(channel.slug, episode.id, { script, scenes, assets });
        if (!r.ok) return setMessage({ kind: "bad", text: r.error });
      }
      const r = await startJob(kind, channel.slug, episode.id);
      setMessage(r.ok ? null : { kind: "bad", text: r.error });
    });

  const setStatus = (status: Episode["status"]) => run(() => updateEpisode(channel.slug, episode.id, { status }), `Marked as ${STATUS_LABEL[status].toLowerCase()}.`);

  return (
    <div className="editor">
      <header className="page-head">
        <div>
          <p className="small muted"><Link href={`/c/${channel.slug}`}>{channel.name}</Link> / {episode.id}</p>
          <h1 style={{ marginTop: 6 }}>{episode.title}</h1>
        </div>
        <div className="row">
          <StatusDot status={episode.status} />
          {episode.status === "rendered" && <button className="primary" onClick={() => setStatus("approved")} disabled={pending}>Approve</button>}
          {episode.status === "approved" && <button className="primary" onClick={() => setStatus("posted")} disabled={pending}>Mark as posted</button>}
          <select aria-label="Status" value={episode.status} onChange={(e) => setStatus(e.target.value as Episode["status"])} style={{ width: "auto" }}>
            {EpisodeStatus.options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </header>

      <div className="editor-grid">
        <section className="stage">
          {video && (
            <div className="tabs" role="tablist">
              <button role="tab" aria-selected={view === "render"} onClick={() => setView("render")}>Rendered video</button>
              <button role="tab" aria-selected={view === "preview"} onClick={() => setView("preview")}>Live preview</button>
            </div>
          )}
          {view === "render" && video ? (
            <video key={video} src={video} controls playsInline className="video" />
          ) : preview.props ? (
            <EpisodePlayer props={preview.props} />
          ) : (
            <div className="video empty">The preview can’t be built yet. See the problems below.</div>
          )}
          {view === "preview" && preview.problems.length > 0 && (
            <div className="stack" style={{ marginTop: 12 }}>
              {preview.problems.map((p) => <div key={p} className="notice">{p}</div>)}
            </div>
          )}
          {view === "render" && <p className="small faint" style={{ marginTop: 8 }}>This is the last render. Edits show up in the live preview until you render again.</p>}
        </section>

        <section className="work">
          <div className="panel pad stack">
            <div className="spread">
              <h3>Make this reel</h3>
              {active && <span className="small muted">{active.state === "queued" ? "Waiting in the queue…" : `Running ${active.kind}…`}</span>}
            </div>
            <ol className="steps">
              <li><button onClick={() => job("voice")} disabled={pending || !!active}>Record voice</button><span className="small muted">Narrates the script, one beat per paragraph</span></li>
              <li><button onClick={() => job("assets")} disabled={pending || !!active}>Download images</button><span className="small muted">Fetches everything listed under Images</span></li>
              <li><button onClick={() => job("render")} disabled={pending || !!active}>Render video</button><span className="small muted">Writes the MP4, cover and post text. Takes a few minutes</span></li>
            </ol>
            <div className="row">
              <button className="primary" onClick={() => job("make")} disabled={pending || !!active}>Do all three</button>
            </div>
            {lastJob && (lastJob.log.length > 0 || lastJob.state !== "done") && (
              <details open={lastJob.state !== "done"}>
                <summary className="small muted">
                  Last run: {lastJob.kind}, {lastJob.state === "failed" ? "failed" : lastJob.state === "done" ? "finished" : lastJob.state}
                </summary>
                <pre className="log">{lastJob.log.slice(-40).join("\n") || "Starting…"}</pre>
              </details>
            )}
          </div>

          {message && <div className={`notice ${message.kind}`} role="status">{message.text}</div>}

          <div className="panel pad">
            <div className="tabs" role="tablist">
              {TABS.map(([t, label]) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{label}</button>
              ))}
            </div>

            {tab === "script" && (
              <div className="stack">
                <p className="small muted">Each paragraph is one narration beat. Lines starting with # are notes and aren’t spoken.</p>
                <textarea className="prose" rows={20} value={script} onChange={(e) => setScript(e.target.value)} spellCheck />
                <SaveRow dirty={dirty} pending={pending} onSave={save} />
              </div>
            )}

            {tab === "scenes" && (
              <div className="stack">
                <p className="small muted">
                  Each scene starts at a beat (<code>beat</code>, counting from 0), optionally partway through it (<code>at</code>, 0–1).
                  Visuals: <code>image</code>, <code>title</code>, <code>text</code>, <code>list</code>, <code>starfield</code> (orion, ursa-major, leo, scorpius, cassiopeia). Transitions: cut, crossfade, zoom, whip, wipe, flash, blur.
                </p>
                <textarea rows={24} value={scenes} onChange={(e) => setScenes(e.target.value)} spellCheck={false} />
                <SaveRow dirty={dirty} pending={pending} onSave={save} />
              </div>
            )}

            {tab === "images" && (
              <div className="stack">
                {images.length > 0 && (
                  <div className="thumbs">
                    {images.map((img) => (
                      <figure key={img.key}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.key} loading="lazy" />
                        <figcaption><strong>{img.key}</strong> <span className="faint">{img.width}×{img.height}</span></figcaption>
                      </figure>
                    ))}
                  </div>
                )}
                <p className="small muted">
                  Name each image, then point it at a source: <code>wikimedia:File:…</code>, <code>met:&lt;object id&gt;</code> or <code>local:path/in/episode.jpg</code>.
                  Add <code>crop</code> (0–1 values) to cut a detail from a large original.
                </p>
                <textarea rows={14} value={assets} onChange={(e) => setAssets(e.target.value)} spellCheck={false} />
                <SaveRow dirty={dirty} pending={pending} onSave={save} />
              </div>
            )}

            {tab === "post" && <PostTab channel={channel} episode={episode} series={series} post={post} />}
            {tab === "stats" && <StatsTab channel={channel.slug} episode={episode} />}
          </div>
        </section>
      </div>
    </div>
  );
}

function SaveRow({ dirty, pending, onSave }: { dirty: boolean; pending: boolean; onSave: () => void }) {
  return (
    <div className="row">
      <button className="primary" onClick={onSave} disabled={!dirty || pending}>Save</button>
      <span className="small faint">{dirty ? "Unsaved changes" : "All changes saved"}</span>
    </div>
  );
}

function PostTab({ channel, episode, series, post }: Pick<Props, "channel" | "episode" | "series" | "post">) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const submit = (form: FormData) =>
    start(async () => {
      const r = await updateEpisode(channel.slug, episode.id, {
        title: String(form.get("title")),
        caption: String(form.get("caption")),
        hashtags: String(form.get("hashtags")).split(/[\s,]+/).map((t) => t.replace(/^#/, "")).filter(Boolean),
        scheduledFor: String(form.get("scheduledFor")) || null,
        series: String(form.get("series")) || null,
        hookType: String(form.get("hookType")),
        notes: String(form.get("notes")),
      });
      setMsg(r.ok ? "Saved." : r.error);
      if (r.ok) router.refresh();
    });
  return (
    <form action={submit} className="stack">
      <label className="field">Title<input name="title" defaultValue={episode.title} required /></label>
      <div className="grid-2" style={{ gap: 12 }}>
        <label className="field">Series
          <select name="series" defaultValue={episode.series ?? ""}>
            <option value="">No series</option>
            {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="field">Post on<input type="date" name="scheduledFor" defaultValue={episode.scheduledFor?.slice(0, 10) ?? ""} /></label>
      </div>
      <label className="field">Caption<textarea className="prose" name="caption" rows={5} defaultValue={episode.caption} /></label>
      <label className="field">Hashtags <span className="faint">(the channel adds {channel.hashtags.map((h) => `#${h}`).join(" ")})</span>
        <input name="hashtags" defaultValue={episode.hashtags.map((h) => `#${h}`).join(" ")} />
      </label>
      <label className="field">Hook type <span className="faint">(used to compare what works, e.g. hidden-detail, question, shock-stat)</span>
        <input name="hookType" defaultValue={episode.tags.hookType ?? ""} />
      </label>
      <label className="field">Notes<textarea className="prose" name="notes" rows={3} defaultValue={episode.notes} /></label>
      <div className="row"><button className="primary" disabled={pending}>Save post details</button>{msg && <span className="small muted">{msg}</span>}</div>
      {post && (
        <div className="stack" style={{ marginTop: 8 }}>
          <div className="spread">
            <h3>Ready to paste</h3>
            <button type="button" onClick={() => { void navigator.clipboard.writeText(post); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? "Copied" : "Copy caption"}
            </button>
          </div>
          <pre className="post">{post}</pre>
          <p className="small faint">Written at the last render. Render again to pick up caption changes.</p>
        </div>
      )}
    </form>
  );
}

function StatsTab({ channel, episode }: { channel: string; episode: Episode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const fields: [string, string][] = [["views", "Views"], ["likes", "Likes"], ["comments", "Comments"], ["saves", "Saves"], ["shares", "Shares"], ["follows", "Follows"], ["avgWatchSeconds", "Avg. watch (s)"]];
  return (
    <div className="stack">
      {episode.metrics.length > 0 ? (
        <table>
          <thead><tr><th>Date</th>{fields.map(([, l]) => <th key={l} className="num">{l}</th>)}</tr></thead>
          <tbody>
            {episode.metrics.map((m) => (
              <tr key={m.date}><td>{m.date}</td>{fields.map(([k]) => <td key={k} className="num">{(m as Record<string, unknown>)[k] as number ?? "–"}</td>)}</tr>
            ))}
          </tbody>
        </table>
      ) : <p className="muted">No stats yet. After posting, copy the numbers from Instagram Insights here every few days.</p>}
      <form className="stack" action={(f) => start(async () => { const r = await addMetrics(channel, episode.id, f); setMsg(r.ok ? "Stats saved." : r.error); if (r.ok) router.refresh(); })}>
        <div className="metrics-form">
          <label className="field">Date<input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
          {fields.map(([k, l]) => <label key={k} className="field">{l}<input name={k} inputMode="decimal" /></label>)}
        </div>
        <div className="row"><button className="primary" disabled={pending}>Save stats</button>{msg && <span className="small muted">{msg}</span>}</div>
      </form>
    </div>
  );
}
