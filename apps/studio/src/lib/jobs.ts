import "server-only";
import { spawn } from "node:child_process";
import path from "node:path";
import { ROOT } from "@cf/core";

export type JobKind = "voice" | "assets" | "render" | "make" | "make-all" | "generate" | "style";
export interface Job {
  id: string;
  kind: JobKind;
  /** shown in the queue, e.g. "Generate 5 episodes" */
  label: string;
  channel: string;
  /** null for channel-wide jobs (generate, style, make-all) */
  episode: string | null;
  args: string[];
  state: "queued" | "running" | "done" | "failed";
  log: string[];
  queuedAt: number;
  startedAt?: number;
  endedAt?: number;
}

// Kept on globalThis so the queue survives dev-server hot reloads.
const g = globalThis as unknown as { __cfJobs?: { jobs: Job[]; running: boolean } };
const store = (g.__cfJobs ??= { jobs: [], running: false });

export const listJobs = () => store.jobs.slice().reverse();

const LABEL: Record<JobKind, string> = {
  voice: "Record voice", assets: "Download images", render: "Render video", make: "Voice, images and render",
  "make-all": "Make all scripted episodes", generate: "Generate episodes", style: "Generate style",
};

/** Queue a `cf` command. `args` follow the command name, e.g. ["art-history", "001-x"]. */
export function enqueue(kind: JobKind, channel: string, episode: string | null, extra: string[] = [], label?: string): Job {
  const existing = store.jobs.find((j) => j.kind === kind && j.channel === channel && j.episode === episode && (j.state === "queued" || j.state === "running"));
  if (existing) return existing;
  const args = [channel, ...(episode ? [episode] : []), ...extra];
  const job: Job = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind, label: label ?? LABEL[kind],
    channel, episode, args, state: "queued", log: [], queuedAt: Date.now(),
  };
  store.jobs.push(job);
  if (store.jobs.length > 100) store.jobs.splice(0, store.jobs.length - 100);
  void pump();
  return job;
}

/** One job at a time: renders are CPU-heavy and share the machine. */
async function pump() {
  if (store.running) return;
  const next = store.jobs.find((j) => j.state === "queued");
  if (!next) return;
  store.running = true;
  next.state = "running";
  next.startedAt = Date.now();
  await new Promise<void>((resolve) => {
    const tsx = path.join(ROOT, "node_modules", ".bin", "tsx");
    const child = spawn(tsx, [path.join(ROOT, "packages/cli/src/cf.ts"), next.kind, ...next.args], { cwd: ROOT, env: process.env });
    const onData = (buf: Buffer) => {
      for (const line of buf.toString().split("\n")) if (line.trim()) next.log.push(line);
      if (next.log.length > 400) next.log.splice(0, next.log.length - 400);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("close", (code) => {
      next.state = code === 0 ? "done" : "failed";
      next.endedAt = Date.now();
      resolve();
    });
  });
  store.running = false;
  void pump();
}
