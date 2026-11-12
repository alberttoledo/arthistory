import { execFileSync } from "node:child_process";

export function probeDuration(file: string): number {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file,
  ]).toString();
  return parseFloat(out);
}

export function probeSize(file: string): { width: number; height: number } {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file,
  ]).toString().trim();
  const [width, height] = out.split(",").map(Number);
  return { width, height };
}

export function ffmpeg(args: string[]) {
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args]);
}

/**
 * Crop (normalized coords) and downscale a still with macOS `sips`,
 * which copes with huge museum originals that ffmpeg's JPEG decoder rejects.
 */
export function cropImage(src: string, out: string, maxWidth: number, crop?: { x: number; y: number; w: number; h: number }) {
  const dims = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", src]).toString();
  const W = Number(/pixelWidth: (\d+)/.exec(dims)![1]);
  const H = Number(/pixelHeight: (\d+)/.exec(dims)![1]);
  const args = ["-s", "format", "jpeg", "-s", "formatOptions", "90"];
  let w = W;
  if (crop) {
    const cw = Math.round(W * crop.w), ch = Math.round(H * crop.h);
    // sips treats an offset of exactly (0, 0) as "center the crop", so never pass both zeros.
    const oy = Math.round(H * crop.y), ox = Math.round(W * crop.x);
    args.push("--cropOffset", String(oy || 1), String(ox), "-c", String(ch), String(cw));
    w = cw;
  }
  execFileSync("sips", [...args, src, "--out", out], { stdio: "ignore" });
  if (w > maxWidth) execFileSync("sips", ["--resampleWidth", String(maxWidth), out], { stdio: "ignore" });
}
