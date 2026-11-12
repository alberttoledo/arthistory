"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MoodboardReferences } from "@cf/core/schemas.ts";
import { newMoodboardVersion, removeMoodboardImage, saveMoodboardNotes, saveReferences, uploadMoodboard } from "@/app/actions";

interface Board { version: string; images: string[]; notes: string; references: MoodboardReferences }

export function Moodboards({ slug, boards, styleVersion }: { slug: string; boards: Board[]; styleVersion: string | null }) {
  const [version, setVersion] = useState(boards[0]?.version ?? "v1");
  const board = boards.find((b) => b.version === version) ?? { version, images: [], notes: "", references: {} };
  const [notes, setNotes] = useState(board.notes);
  const [refs, setRefs] = useState<MoodboardReferences>(board.references);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const refsDirty = JSON.stringify(refs) !== JSON.stringify(board.references);

  const pick = (v: string) => {
    const b = boards.find((x) => x.version === v);
    setVersion(v); setNotes(b?.notes ?? ""); setRefs(b?.references ?? {});
  };

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const form = new FormData();
    for (const f of files) form.append("images", f);
    start(async () => {
      const r = await uploadMoodboard(slug, version, form);
      setMsg(r.ok ? `Added ${files.length} ${files.length === 1 ? "image" : "images"} to ${version}. Say what to take from each one below.` : r.error);
      router.refresh();
    });
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="spread">
        <div className="tabs" role="tablist" style={{ marginBottom: 0, borderBottom: 0 }}>
          {boards.map((b) => (
            <button key={b.version} role="tab" aria-selected={b.version === version} onClick={() => pick(b.version)}>
              {b.version}{b.version === styleVersion ? " (current style)" : ""}
            </button>
          ))}
        </div>
        <button disabled={pending} onClick={() => start(async () => { await newMoodboardVersion(slug); router.refresh(); })}>Start a new version</button>
      </div>

      <label className={`drop${over ? " over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}>
        {board.images.length ? "Drop more references here, or click to choose" : `Drop reference images for ${version} here, or click to choose`}
        <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      </label>

      {board.images.length > 0 && (
        <div className="refs">
          {board.images.map((f) => (
            <figure key={f} className="ref">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/${slug}/moodboard/${version}/${encodeURIComponent(f)}`} alt={f} loading="lazy" />
              <figcaption className="stack" style={{ gap: 6 }}>
                <label className="field">What to take from this
                  <textarea className="prose" rows={3} value={refs[f]?.take ?? ""} placeholder="e.g. only the color palette; the grain and light leaks; the way type sits over the photo"
                    onChange={(e) => setRefs({ ...refs, [f]: { take: e.target.value } })} />
                </label>
                <button type="button" className="ghost small" style={{ alignSelf: "flex-start" }} disabled={pending}
                  onClick={() => start(async () => { const r = await removeMoodboardImage(slug, version, f); setMsg(r.ok ? `Removed ${f}.` : r.error); router.refresh(); })}>
                  Remove
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {board.images.length > 0 && (
        <div className="row">
          <button className="primary" disabled={pending || !refsDirty} onClick={() => start(async () => { const r = await saveReferences(slug, version, refs); setMsg(r.ok ? "Reference notes saved." : r.error); router.refresh(); })}>Save reference notes</button>
          {refsDirty && <span className="small faint">Unsaved notes</span>}
        </div>
      )}

      <label className="field">Notes for the whole moodboard
        <textarea className="prose" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="row">
        <button disabled={pending || notes === board.notes} onClick={() => start(async () => { const r = await saveMoodboardNotes(slug, version, notes); setMsg(r.ok ? "Notes saved." : r.error); router.refresh(); })}>Save notes</button>
        {msg && <span className="small muted">{msg}</span>}
      </div>
      <p className="small faint">When the references and notes are in, go to Look and feel and choose Generate style.</p>
    </div>
  );
}
