import type { WordTiming } from "../../core/src/schemas.ts";

export interface CaptionChunk {
  words: WordTiming[];
  start: number;
  end: number;
}

/**
 * Group words into on-screen chunks of up to `size` words.
 * A chunk also ends early after sentence/clause punctuation so captions follow the speech rhythm.
 */
export function chunkWords(words: WordTiming[], size: number): CaptionChunk[] {
  const chunks: CaptionChunk[] = [];
  let cur: WordTiming[] = [];
  const flush = () => {
    if (!cur.length) return;
    chunks.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  for (const w of words) {
    cur.push(w);
    if (cur.length >= size || /[.!?,;:—]["')\]]*$/.test(w.text)) flush();
  }
  flush();
  // Hold each chunk until the next one starts so captions never blink off mid-sentence.
  for (let i = 0; i < chunks.length - 1; i++) {
    const gap = chunks[i + 1].start - chunks[i].end;
    if (gap < 0.6) chunks[i].end = chunks[i + 1].start;
  }
  return chunks;
}
