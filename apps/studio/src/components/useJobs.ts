"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Job } from "@/lib/jobs";

/** Poll the job queue; refresh server data when one of the watched jobs finishes. */
export function useJobs(filter?: (j: Job) => boolean, intervalMs = 1500) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const router = useRouter();
  const prevActive = useRef<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const all: Job[] = await fetch("/api/jobs", { cache: "no-store" }).then((r) => r.json());
        if (!alive) return;
        const mine = filter ? all.filter(filter) : all;
        const active = new Set(mine.filter((j) => j.state === "queued" || j.state === "running").map((j) => j.id));
        const finished = [...prevActive.current].some((id) => !active.has(id));
        prevActive.current = active;
        setJobs(mine);
        if (finished) router.refresh();
      } catch {
        // Dev server restarting; try again next tick.
      }
    };
    void tick();
    const t = setInterval(tick, intervalMs);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);
  return jobs;
}
