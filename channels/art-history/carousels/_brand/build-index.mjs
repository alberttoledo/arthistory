// Collects every <slug>/carousel.json + renders into manifest.js for index.html.
// usage: node channels/art-history/carousels/_brand/build-index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const items = [];
for (const slug of fs.readdirSync(root).sort()) {
  const dir = path.join(root, slug);
  if (slug.startsWith('_') || !fs.statSync(dir).isDirectory()) continue;
  const cj = path.join(dir, 'carousel.json');
  const rd = path.join(dir, 'renders');
  if (!fs.existsSync(cj) || !fs.existsSync(rd)) continue;
  const meta = JSON.parse(fs.readFileSync(cj, 'utf8'));
  const renders = fs.readdirSync(rd).filter(f => /^\d+\.jpg$/.test(f)).sort().map(f => `${slug}/renders/${f}`);
  const sources = fs.existsSync(path.join(dir, 'sources.md')) ? fs.readFileSync(path.join(dir, 'sources.md'), 'utf8') : '';
  items.push({ ...meta, slug, renders, sources });
}
fs.writeFileSync(path.join(root, 'manifest.js'), `window.CAROUSELS = ${JSON.stringify(items, null, 1)};\n`);
console.log(`manifest.js: ${items.length} carousels, ${items.reduce((a, c) => a + c.renders.length, 0)} slides`);
