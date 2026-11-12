import "server-only";
import fs from "node:fs";
import {
  EpisodeStatus, episodeFiles, getStyle, listChannels, listEpisodes, listSeries, readFollowers,
  type Channel, type Episode, type Style,
} from "@cf/core";

export const PROJECT_START = "2026-11-03";

export const latestMetrics = (ep: Episode) => ep.metrics[ep.metrics.length - 1];

export function episodeMedia(ep: Episode) {
  const f = episodeFiles(ep.channel, ep.id);
  const base = `/api/media/${ep.channel}/episodes/${ep.id}`;
  return {
    video: fs.existsSync(`${f.rendersDir}/final.mp4`) ? `${base}/renders/final.mp4` : null,
    cover: fs.existsSync(`${f.rendersDir}/cover.jpg`) ? `${base}/renders/cover.jpg` : null,
    renderedAt: fs.existsSync(`${f.rendersDir}/final.mp4`) ? fs.statSync(`${f.rendersDir}/final.mp4`).mtimeMs : null,
    base,
  };
}

export interface ChannelSummary {
  channel: Channel;
  style: Style;
  episodes: Episode[];
  followers: number;
  views: number;
  counts: Record<EpisodeStatus, number>;
  seriesNames: Record<string, string>;
}

export function channelSummary(channel: Channel): ChannelSummary {
  const episodes = listEpisodes(channel.slug);
  const log = readFollowers(channel.slug);
  const counts = Object.fromEntries(EpisodeStatus.options.map((s) => [s, 0])) as Record<EpisodeStatus, number>;
  for (const e of episodes) counts[e.status]++;
  return {
    channel,
    style: getStyle(channel.slug),
    episodes,
    followers: log[log.length - 1]?.followers ?? 0,
    views: episodes.reduce((sum, e) => sum + (latestMetrics(e)?.views ?? 0), 0),
    counts,
    seriesNames: Object.fromEntries(listSeries(channel.slug).map((s) => [s.id, s.name])),
  };
}

export const allSummaries = () => listChannels().map(channelSummary);

export function dayOfProject(today = new Date()) {
  const start = new Date(PROJECT_START + "T00:00:00");
  const deadline = new Date(listChannels()[0]?.goals.deadline + "T00:00:00");
  const day = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
  const total = Math.round((deadline.getTime() - start.getTime()) / 86400000);
  return { day: Math.max(1, day), total, deadline };
}

export const compact = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : String(n);
