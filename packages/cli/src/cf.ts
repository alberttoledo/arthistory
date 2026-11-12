#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import {
  episodeFiles, generateEpisodes, getChannel, getEpisode, listChannels, listEpisodes, loadEnv, proposeStyle, resolveAssets,
  saveEpisode, searchMet, searchWikimedia, voiceEpisode, writePostPackage, EpisodeStatus, ROOT,
} from "../../core/src/index.ts";

loadEnv();
import { renderEpisode } from "../../video/src/render.ts";

const [cmd, ...args] = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const need = (v: string | undefined, what: string) => {
  if (!v) { console.error(`Missing ${what}. Run "npm run cf help".`); process.exit(1); }
  return v;
};
const rel = (p: string) => path.relative(ROOT, p);

function setStatus(slug: string, id: string, status: EpisodeStatus) {
  const ep = getEpisode(slug, id);
  const order = EpisodeStatus.options;
  // Never move an episode backwards automatically (e.g. re-rendering an approved one).
  if (order.indexOf(status) > order.indexOf(ep.status)) saveEpisode({ ...ep, status });
}

const commands: Record<string, () => Promise<void> | void> = {
  help() {
    console.log(`cf — Content Factory

  list                              channels and episode counts by status
  episodes <channel>                episodes of a channel
  new <channel> <id> --title "…"    create an episode folder (script.md, assets.json, scenes.json)
  voice <channel> <id>              narrate script.md → vo.mp3 + vo.timeline.json
  assets <channel> <id>             download assets.json → assets/
  render <channel> <id>             render renders/final.mp4 + cover.jpg + post.txt
  make <channel> <id>               voice + assets + render
  make-all <channel> [--status s]   make every episode at a status (default: scripted)
  generate <channel> --topic "…" [--count N] [--series id | --new-series "Name"] [--start YYYY-MM-DD] [--every days]
                                    write episodes (script, scenes, pictures) and schedule them
  style <channel>                   turn the style brief + latest moodboard into style.json
  status <channel> <id> <status>    set status (${EpisodeStatus.options.join(", ")})
  search met|wikimedia "<query>"    find public-domain images for assets.json`);
  },

  list() {
    for (const c of listChannels()) {
      const eps = listEpisodes(c.slug);
      const counts = EpisodeStatus.options.map((s) => [s, eps.filter((e) => e.status === s).length] as const)
        .filter(([, n]) => n).map(([s, n]) => `${s}:${n}`).join(" ");
      console.log(`${c.slug.padEnd(18)} ${c.handle.padEnd(22)} ${eps.length} episodes ${counts}`);
    }
  },

  episodes() {
    const slug = need(args[0], "channel");
    for (const e of listEpisodes(slug)) console.log(`${e.id.padEnd(32)} ${e.status.padEnd(9)} ${e.title}`);
  },

  new() {
    const slug = need(args[0], "channel");
    const id = need(args[1], "episode id");
    getChannel(slug);
    const files = episodeFiles(slug, id);
    if (fs.existsSync(files.dir)) throw new Error(`${rel(files.dir)} already exists`);
    fs.mkdirSync(files.dir, { recursive: true });
    saveEpisode({
      id, channel: slug, series: flag("series") ?? null, title: flag("title") ?? id, status: "idea",
      scheduledFor: null, postedAt: null, caption: "", hashtags: [], tags: {}, notes: "", metrics: [],
    });
    fs.writeFileSync(files.script, "# Title (not spoken)\n\nFirst beat: the hook.\n\nSecond beat.\n");
    fs.writeFileSync(files.assetSpecs, "{}\n");
    fs.writeFileSync(files.scenes, JSON.stringify({ scenes: [{ beat: 0, visual: { type: "title", text: flag("title") ?? id } }] }, null, 2) + "\n");
    console.log(`Created ${rel(files.dir)}`);
  },

  async voice() {
    const [slug, id] = [need(args[0], "channel"), need(args[1], "episode id")];
    const t = await voiceEpisode(slug, id);
    setStatus(slug, id, "voiced");
    console.log(`  voice: ${t.provider}, ${t.beats.length} beats, ${t.duration.toFixed(1)}s`);
  },

  async assets() {
    const [slug, id] = [need(args[0], "channel"), need(args[1], "episode id")];
    const m = await resolveAssets(slug, id);
    console.log(`  ${Object.keys(m).length} assets ready`);
  },

  async render() {
    const [slug, id] = [need(args[0], "channel"), need(args[1], "episode id")];
    const out = await renderEpisode(slug, id);
    writePostPackage(slug, id);
    setStatus(slug, id, "rendered");
    console.log(`  → ${rel(out)}`);
  },

  async make() {
    console.log("1/3 voice");
    await commands.voice();
    console.log("2/3 assets");
    await commands.assets();
    console.log("3/3 render");
    await commands.render();
  },

  async "make-all"() {
    const slug = need(args[0], "channel");
    const status = EpisodeStatus.parse(flag("status") ?? "scripted");
    const eps = listEpisodes(slug).filter((e) => e.status === status);
    if (!eps.length) return console.log(`No ${status} episodes in ${slug}.`);
    for (const [i, e] of eps.entries()) {
      console.log(`== ${i + 1}/${eps.length} ${e.title}`);
      args.splice(1, args.length, e.id);
      await commands.make();
    }
  },

  async generate() {
    const slug = need(args[0], "channel");
    const ids = await generateEpisodes(slug, {
      topic: need(flag("topic"), "--topic"),
      count: Number(flag("count") ?? 1),
      seriesId: flag("series") ?? null,
      newSeriesName: flag("new-series") ?? null,
      startDate: flag("start") ?? null,
      everyDays: Number(flag("every") ?? 1),
    });
    console.log(`Created ${ids.length} episode${ids.length === 1 ? "" : "s"}: ${ids.join(", ")}`);
  },

  async style() {
    await proposeStyle(need(args[0], "channel"));
    console.log("  style.json updated (previous version kept in style.previous.json)");
  },

  status() {
    const [slug, id, status] = [need(args[0], "channel"), need(args[1], "episode id"), need(args[2], "status")];
    const ep = getEpisode(slug, id);
    saveEpisode({ ...ep, status: EpisodeStatus.parse(status), postedAt: status === "posted" ? new Date().toISOString() : ep.postedAt });
  },

  async search() {
    const [where, query] = [need(args[0], "met|wikimedia"), need(args[1], "query")];
    if (where === "met") {
      for (const o of await searchMet(query)) console.log(`met:${o.objectID}\t${o.title} — ${o.artistDisplayName} ${o.objectDate}`);
    } else {
      for (const t of await searchWikimedia(query)) console.log(`wikimedia:${t}`);
    }
  },
};

const run = commands[cmd ?? "help"];
if (!run) { console.error(`Unknown command "${cmd}"`); commands.help(); process.exit(1); }
Promise.resolve(run()).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
