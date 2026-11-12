import { execFile, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { loadEnv } from "../env.ts";

export const MODEL = "claude-opus-5-5";

export interface JsonRequest<T extends z.ZodType> {
  system: string;
  prompt: string;
  schema: T;
  /** local image files to show the model (moodboards, candidate pictures) */
  images?: string[];
  effort?: "low" | "medium" | "high" | "xhigh";
  log?: (s: string) => void;
}

export type Provider = "api" | "claude-code";

/** API key wins; otherwise use the Claude Code CLI login on this machine. */
export function provider(): Provider {
  loadEnv();
  return process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? "api" : "claude-code";
}

/** Downscale an image for the model (long edge ≤ 1568px, JPEG) using macOS sips. */
function prepareImage(file: string): string {
  const out = path.join(os.tmpdir(), `cf-img-${Buffer.from(file).toString("base64url").slice(-40)}.jpg`);
  if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(file).mtimeMs) {
    execFileSync("sips", ["-s", "format", "jpeg", "-Z", "1568", file, "--out", out], { stdio: "ignore" });
  }
  return out;
}

async function viaApi<T extends z.ZodType>(req: JsonRequest<T>): Promise<z.infer<T>> {
  const client = new Anthropic();
  const content: Anthropic.ContentBlockParam[] = [];
  for (const img of req.images ?? []) {
    const data = fs.readFileSync(prepareImage(img)).toString("base64");
    content.push({ type: "text", text: `Image: ${path.basename(img)}` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } });
  }
  content.push({ type: "text", text: req.prompt });
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    system: req.system,
    output_config: { effort: req.effort ?? "high", format: zodOutputFormat(req.schema) },
    messages: [{ role: "user", content }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") throw new Error("Claude declined this request.");
  if (message.stop_reason === "max_tokens") throw new Error("The answer was cut off (too long). Try fewer episodes at once.");
  const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return req.schema.parse(JSON.parse(text));
}

function viaClaudeCode<T extends z.ZodType>(req: JsonRequest<T>): Promise<z.infer<T>> {
  const images = (req.images ?? []).map(prepareImage);
  const imageNote = images.length
    ? `\n\nLook at these images with the Read tool before answering:\n${images.map((f) => `- ${f}`).join("\n")}`
    : "";
  // The CLI validates against draft-07 and rejects zod's default 2020-12 "$schema" marker.
  const { $schema: _drop, ...jsonSchema } = z.toJSONSchema(req.schema, { target: "draft-7" }) as Record<string, unknown>;
  const schema = JSON.stringify(jsonSchema);
  const args = [
    "-p", "--output-format", "json", "--model", "opus", "--json-schema", schema,
    "--append-system-prompt", req.system,
    "--allowedTools", "Read", "--add-dir", os.tmpdir(),
    ...[...new Set(images.map((f) => path.dirname(f)))].flatMap((d) => ["--add-dir", d]),
  ];
  return new Promise((resolve, reject) => {
    const child = execFile("claude", args, { maxBuffer: 64 * 1024 * 1024, timeout: 15 * 60 * 1000 }, (err, stdout, stderr) => {
      let out: { is_error?: boolean; result?: string; structured_output?: unknown };
      try {
        out = JSON.parse(stdout);
      } catch {
        // Don't echo the whole command line (it contains the full prompt); stderr has the reason.
        return reject(new Error(`Claude Code failed: ${(stderr || err?.message || "no output").trim().split("\n").slice(-3).join(" ")}`));
      }
      if (out.is_error) {
        const msg = out.result ?? "Claude Code failed.";
        return reject(new Error(/authenticat|401|log ?in/i.test(msg)
          ? `Claude Code isn't signed in. Run "claude" in a terminal and sign in, or add ANTHROPIC_API_KEY to .env. (${msg})`
          : msg));
      }
      try {
        resolve(req.schema.parse(out.structured_output ?? JSON.parse(out.result ?? "")));
      } catch (e) {
        reject(new Error(`Claude Code's answer didn't match the expected shape: ${(e as Error).message.slice(0, 400)}`));
      }
    });
    child.stdin?.end(req.prompt + imageNote);
  });
}

/** Ask Claude for JSON matching `schema`. Retries once on a shape error. */
export async function generateJson<T extends z.ZodType>(req: JsonRequest<T>): Promise<z.infer<T>> {
  const run = provider() === "api" ? viaApi : viaClaudeCode;
  req.log?.(`  asking Claude (${provider() === "api" ? "API" : "Claude Code login"})…`);
  try {
    return await run(req);
  } catch (e) {
    if (e instanceof z.ZodError || /expected shape|JSON/.test((e as Error).message)) {
      req.log?.("  answer had the wrong shape, retrying once…");
      return run(req);
    }
    throw e;
  }
}
