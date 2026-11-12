import { describe, expect, it } from "vitest";
import { z } from "zod";
import { DraftEpisode, toScenes } from "../src/ai/episodes.ts";

const base = { image: null, fit: null, from: null, to: null, kicker: null, text: null, sub: null, attribution: null, listTitle: null, items: null, constellation: null, transition: null, label: null };

const draft: z.infer<typeof DraftEpisode> = {
  title: "Leonardo's notebooks", hookType: "bold-claim",
  beats: ["Hook.", "Two.", "Three."],
  caption: "", hashtags: [],
  images: [
    { key: "page", search: "Leonardo notebook", source: "wikimedia", wants: "a notebook page", fallbackText: "7,000 pages" },
    { key: "missing", search: "x", source: "wikimedia", wants: "y", fallbackText: "No picture" },
  ],
  scenes: [
    { ...base, beat: 1, at: 0, type: "image", image: "missing", label: "Florence" },
    { ...base, beat: 0, at: 0.3, type: "image", image: "page", from: { x: 0.1, y: 0.5, zoom: 1 }, to: { x: 0.9, y: 0.5, zoom: 1.1 } },
    { ...base, beat: 2, at: 0, type: "list", listTitle: "He wrote about", items: ["water", "flight"], transition: "iris" },
    { ...base, beat: 9, at: 0, type: "title", text: "out of range" },
  ],
};

describe("toScenes", () => {
  const chosen = new Map([["page", { cand: { source: "wikimedia:File:P.jpg", title: "P", width: 2000, height: 1500, license: "PD", thumb: "" }, fx: 0.4, fy: 0.3 }]]);
  const scenes = toScenes(draft, chosen);

  it("sorts by beat, drops out-of-range beats and pins the first shot to the start", () => {
    expect(scenes.map((s) => s.beat)).toEqual([0, 1, 2]);
    expect(scenes[0].at).toBe(0);
  });
  it("keeps a deliberate pan but aims y at the subject the photo editor found", () => {
    const v = scenes[0].visual;
    expect(v.type).toBe("image");
    if (v.type === "image") { expect(v.from.x).toBe(0.1); expect(v.to.x).toBe(0.9); expect(v.from.y).toBe(0.3); }
  });
  it("turns an image with no good picture into its fallback text card, keeping the label", () => {
    expect(scenes[1].visual).toEqual({ type: "text", text: "No picture" });
    expect(scenes[1].overlay?.text).toBe("Florence");
  });
  it("maps list cards and explicit transitions", () => {
    expect(scenes[2].visual).toEqual({ type: "list", title: "He wrote about", items: ["water", "flight"] });
    expect(scenes[2].transition).toBe("iris");
  });
  it("produces a JSON schema the Claude Code CLI accepts (draft-07, no $schema)", () => {
    const js = z.toJSONSchema(DraftEpisode, { target: "draft-7" }) as Record<string, unknown>;
    expect(js.type).toBe("object");
  });
});
