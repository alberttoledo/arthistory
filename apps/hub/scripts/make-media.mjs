// LOCAL ONLY (needs the git-ignored raw videos + ffmpeg). For every story:
//   final takes → <mediaDir>/<takeId>.mp4 (720p web copy) + <takeId>.jpg poster
//   every take  → <mediaDir>/<takeId>.thumb.jpg
//   every ref   → <mediaDir>/refs/<name>.jpg (≤800px)
// Commit the results; CI only copies them. Usage: npm run media -w @cf/hub
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const fresh = (out, src) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;
let made = 0, missing = 0;

for (const ch of fs.readdirSync(path.join(root, "channels"))) {
  const dir = path.join(root, "channels", ch, "stories");
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const story = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const out = path.join(root, story.mediaDir);
    fs.mkdirSync(path.join(out, "refs"), { recursive: true });
    for (const piece of story.pieces) for (const still of piece.stills ?? []) {
      const src = path.join(root, still);
      if (!fs.existsSync(src)) { console.warn(`missing still: ${still}`); missing++; continue; }
      const dst = path.join(out, "refs", path.basename(still).replace(/\.[^.]+$/, "") + ".jpg");
      if (!fresh(dst, src)) { ff(["-i", src, "-vf", "scale='min(800,iw)':-2", "-frames:v", "1", "-q:v", "3", dst]); made++; }
    }
    for (const piece of story.pieces) for (const take of piece.takes ?? []) {
      const raw = path.join(root, take.file);
      if (!fs.existsSync(raw)) { console.warn(`missing raw: ${take.file}`); missing++; continue; }
      const t = Math.min(dur(raw) * 0.4, 8);
      const thumb = path.join(out, `${take.id}.thumb.jpg`);
      if (!fresh(thumb, raw)) { ff(["-ss", String(t), "-i", raw, "-frames:v", "1", "-vf", "scale='if(gt(iw,ih),-2,360)':'if(gt(iw,ih),360,-2)'", "-q:v", "4", thumb]); made++; }
      if (take.final) {
        const mp4 = path.join(out, `${take.id}.mp4`), poster = path.join(out, `${take.id}.jpg`);
        if (!fresh(mp4, raw)) {
          ff(["-i", raw, "-vf", "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'", "-c:v", "libx264", "-preset", "slow", "-crf", "26",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", mp4]); made++;
        }
        if (!fresh(poster, raw)) { ff(["-ss", String(t), "-i", raw, "-frames:v", "1", "-vf", "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'", "-q:v", "3", poster]); made++; }
      }
      for (const ref of take.refs ?? []) {
        const src = path.join(root, ref);
        const dst = path.join(out, "refs", path.basename(ref).replace(/\.[^.]+$/, "") + ".jpg");
        if (!fs.existsSync(src)) { console.warn(`missing ref: ${ref}`); missing++; continue; }
        if (!fresh(dst, src)) { ff(["-i", src, "-vf", "scale='min(800,iw)':-2", "-frames:v", "1", "-q:v", "3", dst]); made++; }
      }
    }
  }
}
console.log(`media: ${made} files written, ${missing} missing sources`);
