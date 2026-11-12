import { describe, expect, it } from "vitest";
import { chunkWords } from "./captions.ts";

describe("chunkWords", () => {
  it("breaks on size and punctuation and holds chunks across short gaps", () => {
    const w = (text: string, start: number) => ({ text, start, end: start + 0.3 });
    const chunks = chunkWords([w("One", 0), w("two,", 0.4), w("three", 0.8), w("four", 1.2), w("five", 1.6)], 3);
    expect(chunks.map((c) => c.words.map((x) => x.text).join(" "))).toEqual(["One two,", "three four five"]);
    expect(chunks[0].end).toBe(0.8);
  });
});
