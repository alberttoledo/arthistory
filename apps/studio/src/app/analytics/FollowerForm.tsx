"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveFollowers } from "@/app/actions";

export function FollowerForm({ slug }: { slug: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  return (
    <form className="row" style={{ flexWrap: "nowrap" }} action={(f) => start(async () => {
      const r = await saveFollowers(slug, f);
      setMsg(r.ok ? null : r.error);
      if (r.ok) router.refresh();
    })}>
      <input name="followers" inputMode="numeric" placeholder="Followers today" aria-label="Followers today" required />
      <input type="hidden" name="date" value={new Date().toISOString().slice(0, 10)} />
      <button disabled={pending}>Log</button>
      {msg && <span className="small" style={{ color: "var(--bad)" }}>{msg}</span>}
    </form>
  );
}
