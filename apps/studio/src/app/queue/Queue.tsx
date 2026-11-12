"use client";

import Link from "next/link";
import { useJobs } from "@/components/useJobs";

const STATE = { queued: "Waiting", running: "Running", done: "Finished", failed: "Failed" };
const COLOR = { queued: "#b7bfcb", running: "#c18a1d", done: "#2f8f5f", failed: "#b3261e" };

const dur = (a?: number, b?: number) => (a ? `${Math.round(((b ?? Date.now()) - a) / 1000)}s` : "");

export function Queue() {
  const jobs = useJobs(undefined, 1000);
  if (!jobs.length) return <p className="muted">No jobs yet. Start one from an episode page.</p>;
  return (
    <div className="stack">
      {jobs.map((j) => (
        <details key={j.id} className="panel pad" open={j.state === "running" || j.state === "failed"}>
          <summary className="spread" style={{ cursor: "pointer" }}>
            <span><strong>{j.label}</strong> <Link href={j.episode ? `/c/${j.channel}/e/${j.episode}` : `/c/${j.channel}`} className="muted">{j.channel}{j.episode ? ` / ${j.episode}` : ""}</Link></span>
            <span className="status" style={{ ["--s" as string]: COLOR[j.state] }}><i />{STATE[j.state]} {dur(j.startedAt, j.endedAt)}</span>
          </summary>
          <pre className="log" style={{ marginTop: 12 }}>{j.log.join("\n") || "No output yet."}</pre>
        </details>
      ))}
    </div>
  );
}
