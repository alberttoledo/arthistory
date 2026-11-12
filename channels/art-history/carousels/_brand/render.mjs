// Render a carousel's slides.html to PNG + JPG, one file per slide (1080×1350).
// usage: node channels/art-history/carousels/_brand/render.mjs <slug> [slideNumber]
// Uses Remotion's bundled headless Chrome over CDP (the plain Chrome CLI --screenshot hangs on this Mac).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openBrowser } from '@remotion/renderer';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2];
const only = process.argv[3] ? +process.argv[3] : null;
if (!slug) { console.error('usage: render.mjs <slug> [n]'); process.exit(1); }
const dir = path.resolve(here, '..', slug);
const html = path.join(dir, 'slides.html');
const out = path.join(dir, 'renders');
fs.mkdirSync(out, { recursive: true });

const src = fs.readFileSync(html, 'utf8');
const count = (src.match(/<section[^>]*class="[^"]*\bslide\b/g) || []).length;

const browser = await openBrowser('chrome', { chromiumOptions: { disableWebSecurity: true }, logLevel: 'error' });
const page = await browser.newPage({ context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
const cdp = page._client();
const evalP = (expression) => cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });

for (let n = 1; n <= count; n++) {
  if (only && n !== only) continue;
  const id = String(n).padStart(2, '0');
  await page.goto({ url: pathToFileURL(html).href + `?s=${n}`, timeout: 60000, options: { waitUntil: 'load' } });
  await evalP(`(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));await new Promise(r=>setTimeout(r,250));return 1})()`);
  const { value } = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, clip: { x: 0, y: 0, width: 1080, height: 1350, scale: 1 } });
  const data = value.data ?? value;
  const png = path.join(out, `${id}.png`);
  fs.writeFileSync(png, Buffer.from(data, 'base64'));
  await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(out, `${id}.jpg`));
  console.log('rendered', slug, id);
}
await browser.close({ silent: true });
