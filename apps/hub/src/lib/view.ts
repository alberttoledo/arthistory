import type { Piece, Role } from "./schema";
import { asset, getCarousel, mediaUrl, refFile, type StoryWithMedia } from "./data";
import { finalTake } from "./status";

export const ROLE_LABEL: Record<Role, string> = { teaser: "Teaser", film: "Film", carousel: "Carousel" };
export const rolePiece = (s: StoryWithMedia, role: Role) => s.pieces.find((p) => p.id === s.rollout[role]);
export const storyHref = (s: StoryWithMedia) => `/ch/${s.channel}/s/${s.slug}/`;

/** Best still for a piece: final poster, else the newest take's thumb, else the carousel cover. */
export function pieceThumb(s: StoryWithMedia, p?: Piece): string | null {
  if (!p) return null;
  if (p.role === "carousel" && p.carousel) { const c = getCarousel(p.carousel); return c ? asset(c.renders[0]) : null; }
  const fin = finalTake(p);
  if (fin) return mediaUrl(s, `${fin.id}.jpg`) ?? mediaUrl(s, `${fin.id}.thumb.jpg`);
  const last = [...p.takes].reverse().find((t) => mediaUrl(s, `${t.id}.thumb.jpg`));
  if (last) return mediaUrl(s, `${last.id}.thumb.jpg`);
  return p.stills[0] ? mediaUrl(s, refFile(p.stills[0])) : null;
}
