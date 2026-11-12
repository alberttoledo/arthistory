import { describe, expect, it } from "vitest";
import { StorySchema } from "./schema";
import { finalTake, pieceStatus, takeLineage } from "./status";

const story = (over: Record<string, unknown> = {}) => StorySchema.parse({
  slug: "03-x", no: "03", title: "X", mediaDir: "assets/x/video/web",
  rollout: { teaser: "teaser", film: "film", carousel: "carousel" },
  pieces: [
    { id: "teaser", role: "teaser", title: "T", takes: [] },
    { id: "film", role: "film", title: "F", takes: [
      { id: "a", file: "a.mp4" },
      { id: "b", file: "b.mp4", derivedFrom: "a", final: true },
    ] },
    { id: "carousel", role: "carousel", title: "C", carousel: "03-x", status: "final" },
  ],
  ...over,
});
const piece = (s: ReturnType<typeof story>, id: string) => s.pieces.find((p) => p.id === id)!;

describe("pieceStatus", () => {
  it("is none for a piece with no takes", () => {
    const s = story();
    expect(pieceStatus(s, piece(s, "teaser")).state).toBe("none");
  });
  it("is draft when takes exist but none is final", () => {
    const s = story({ pieces: [{ id: "film", role: "film", title: "F", takes: [{ id: "a", file: "a.mp4" }] }] });
    expect(pieceStatus(s, piece(s, "film")).state).toBe("draft");
  });
  it("is final with confirmed=false for a guessed final", () => {
    const s = story();
    expect(pieceStatus(s, piece(s, "film"))).toMatchObject({ state: "final", confirmed: false });
  });
  it("prefers scheduled over final, and published over scheduled", () => {
    const s1 = story({ posts: [{ piece: "film", at: "2026-11-20T18:00", status: "planned" }] });
    expect(pieceStatus(s1, piece(s1, "film"))).toMatchObject({ state: "scheduled", at: "2026-11-20T18:00" });
    const s2 = story({ posts: [
      { piece: "film", at: "2026-11-20T18:00", status: "planned" },
      { piece: "film", at: "2026-11-18T18:00", status: "published" },
    ] });
    expect(pieceStatus(s2, piece(s2, "film")).state).toBe("published");
  });
  it("uses the status field for carousels", () => {
    const s = story();
    expect(pieceStatus(s, piece(s, "carousel"))).toMatchObject({ state: "final", confirmed: true });
  });
});

describe("takeLineage", () => {
  it("walks from child to root", () => {
    const s = story(); const p = piece(s, "film");
    expect(takeLineage(p, finalTake(p)!).map((t) => t.id)).toEqual(["b", "a"]);
  });
  it("stops on a missing parent and on a cycle", () => {
    const s = story({ pieces: [{ id: "film", role: "film", title: "F", takes: [
      { id: "a", file: "a.mp4", derivedFrom: "b" }, { id: "b", file: "b.mp4", derivedFrom: "a" },
      { id: "c", file: "c.mp4", derivedFrom: "zzz" },
    ] }] });
    const p = piece(s, "film");
    expect(takeLineage(p, p.takes[0]).map((t) => t.id)).toEqual(["a", "b"]);
    expect(takeLineage(p, p.takes[2]).map((t) => t.id)).toEqual(["c"]);
  });
});
