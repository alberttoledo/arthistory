import type { WordTiming } from "../schemas.ts";

/** Relative "spoken length" of a word: characters plus a pause for trailing punctuation. */
function weight(word: string): number {
  const letters = word.replace(/[^\p{L}\p{N}]/gu, "").length || 1;
  const pause = /[.!?…]["')\]]*$/.test(word) ? 6 : /[,;:—–-]["')\]]*$/.test(word) ? 3 : 0;
  return letters + 1.5 + pause;
}

/**
 * Spread a beat's words across [start, end] proportional to their spoken weight.
 * A stand-in for real alignment when the TTS engine gives no timestamps.
 */
export function estimateWordTimings(text: string, start: number, end: number): WordTiming[] {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map(weight);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = end - start;
  let t = start;
  return words.map((w, i) => {
    const dur = (weights[i] / total) * span;
    const pause = /[.!?,;:]["')\]]*$/.test(w) ? Math.min(dur * 0.35, 0.3) : 0;
    const timing = { text: w, start: t, end: t + dur - pause };
    t += dur;
    return timing;
  });
}
