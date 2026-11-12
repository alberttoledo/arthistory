import type { Piece, Story, Take } from "./schema";

export type PieceState = "none" | "draft" | "final" | "scheduled" | "published";
export type PieceStatus = { state: PieceState; confirmed: boolean; at?: string };

export const finalTake = (piece: Piece): Take | undefined => piece.takes.find((t) => t.final);

/** Rollout status of a piece. Precedence: published > scheduled > final > draft > none. */
export function pieceStatus(story: Story, piece: Piece): PieceStatus {
  const posts = story.posts.filter((p) => p.piece === piece.id);
  const published = posts.filter((p) => p.status === "published").sort((a, b) => b.at.localeCompare(a.at))[0];
  if (published) return { state: "published", confirmed: true, at: published.at };
  const planned = posts.filter((p) => p.status === "planned").sort((a, b) => a.at.localeCompare(b.at))[0];
  if (planned) return { state: "scheduled", confirmed: true, at: planned.at };
  if (piece.role === "carousel") return { state: piece.status === "final" ? "final" : piece.carousel ? "draft" : "none", confirmed: true };
  const fin = finalTake(piece);
  if (fin) return { state: "final", confirmed: fin.confirmed };
  return { state: piece.takes.length ? "draft" : "none", confirmed: true };
}

/** The take and the takes it was made from, child first. Stops at a missing parent or a cycle. */
export function takeLineage(piece: Piece, take: Take): Take[] {
  const out: Take[] = [take];
  const seen = new Set([take.id]);
  let cur = take;
  while (cur.derivedFrom) {
    const parent = piece.takes.find((t) => t.id === cur.derivedFrom);
    if (!parent || seen.has(parent.id)) break;
    out.push(parent); seen.add(parent.id); cur = parent;
  }
  return out;
}
