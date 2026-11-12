// Copies the rendered carousels from channels/art-history/carousels into the app:
//   public/carousels/<slug>/NN.jpg, public/carousels/<slug>.zip (slides + caption.txt)
//   src/data/carousels.json (metadata for the pages)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.resolve(app, "../../channels/art-history/carousels");
const pub = path.join(app, "public/carousels");
fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub, { recursive: true });

// --- minimal ZIP writer (STORE, no compression: JPGs are already compressed)
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zip(entries) {
  const parts = [], central = []; let offset = 0;
  for (const { name, data } of entries) {
    const n = Buffer.from(name), crc = crc32(data);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(n.length, 26);
    const cen = Buffer.alloc(46); cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(data.length, 20); cen.writeUInt32LE(data.length, 24); cen.writeUInt16LE(n.length, 28); cen.writeUInt32LE(offset, 42);
    parts.push(local, n, data); central.push(cen, n); offset += 30 + n.length + data.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, end]);
}

const out = [];
for (const slug of fs.readdirSync(src).sort()) {
  const dir = path.join(src, slug);
  if (slug.startsWith("_") || !fs.statSync(dir).isDirectory()) continue;
  const cj = path.join(dir, "carousel.json"), rd = path.join(dir, "renders");
  if (!fs.existsSync(cj) || !fs.existsSync(rd)) continue;
  const meta = JSON.parse(fs.readFileSync(cj, "utf8"));
  const files = fs.readdirSync(rd).filter((f) => /^\d+\.jpg$/.test(f)).sort();
  fs.mkdirSync(path.join(pub, slug), { recursive: true });
  const entries = [];
  files.forEach((f, i) => {
    const data = fs.readFileSync(path.join(rd, f));
    fs.writeFileSync(path.join(pub, slug, f), data);
    entries.push({ name: `${slug}/${slug}-${String(i + 1).padStart(2, "0")}.jpg`, data });
  });
  const tags = (meta.hashtags || []).map((h) => "#" + String(h).replace(/^#/, "")).join(" ");
  entries.push({ name: `${slug}/caption.txt`, data: Buffer.from(`${meta.caption || ""}\n\n${tags}\n`) });
  fs.writeFileSync(path.join(pub, `${slug}.zip`), zip(entries));
  const sources = fs.existsSync(path.join(dir, "sources.md")) ? fs.readFileSync(path.join(dir, "sources.md"), "utf8") : "";
  out.push({
    slug, no: String(meta.no ?? ""), title: meta.title ?? slug, artist: meta.artist ?? "", year: String(meta.year ?? ""),
    museum: meta.museum ?? "", videoFormat: meta.videoFormat ?? "", hook: meta.hook ?? "", caption: meta.caption ?? "",
    hashtags: meta.hashtags ?? [], notes: meta.notes ?? "",
    slides: (meta.slides ?? []).map((s) => ({ n: s.n, type: s.type ?? "", headline: s.headline ?? "", alt: s.alt ?? "" })),
    renders: files.map((f) => `carousels/${slug}/${f}`), zip: `carousels/${slug}.zip`, sources,
  });
}
out.sort((a, b) => a.no.localeCompare(b.no));
fs.mkdirSync(path.join(app, "src/data"), { recursive: true });
fs.writeFileSync(path.join(app, "src/data/carousels.json"), JSON.stringify(out, null, 1));
console.log(`synced ${out.length} carousels, ${out.reduce((a, c) => a + c.renders.length, 0)} slides`);
