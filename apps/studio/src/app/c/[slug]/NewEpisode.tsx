"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEpisode } from "@/app/actions";

export function NewEpisode({ slug, series }: { slug: string; series: { id: string; name: string }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <button className="primary" onClick={() => dialog.current?.showModal()}>New episode</button>
      <dialog ref={dialog}>
        <form className="stack" action={(f) => start(async () => {
          const r = await createEpisode(slug, f);
          if (!r.ok) return setError(r.error);
          dialog.current?.close();
          router.push(`/c/${slug}/e/${r.id}`);
        })}>
          <h2>New episode</h2>
          <label className="field">Title<input name="title" required autoFocus placeholder="What is this reel about?" /></label>
          <label className="field">Series
            <select name="series"><option value="">No series</option>{series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </label>
          <label className="field">Idea notes<textarea className="prose" name="notes" rows={3} placeholder="Angle, sources, the hook you have in mind" /></label>
          {error && <div className="notice bad">{error}</div>}
          <div className="row"><button className="primary" disabled={pending}>Create episode</button><button type="button" className="ghost" onClick={() => dialog.current?.close()}>Cancel</button></div>
        </form>
      </dialog>
    </>
  );
}
