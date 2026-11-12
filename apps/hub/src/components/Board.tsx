import Link from "next/link";
import type { Channel } from "@/lib/data";
import { ROLES } from "@/lib/schema";
import { pieceStatus } from "@/lib/status";
import { ROLE_LABEL, pieceThumb, rolePiece, storyHref } from "@/lib/view";
import { StatusChip } from "./StatusChip";

export function Board({ channel }: { channel: Channel }) {
  if (!channel.stories.length) return (
    <div className="empty-state"><h2>No stories in {channel.name} yet</h2>
      <p>Stories appear here once a file is added under <code>channels/{channel.slug}/stories/</code>.</p></div>
  );
  return (
    <div className="board">
      <div className="board-head mono"><span>Story</span>{ROLES.map((r, i) => <span key={r}>{i + 1}. {ROLE_LABEL[r]}</span>)}</div>
      {channel.stories.map((s) => (
        <Link key={s.slug} href={storyHref(s)} className="board-row">
          <div className="board-story"><span className="mono gold">No. {s.no}</span><h3>{s.title}</h3><p>{s.artist}{s.year && `, ${s.year}`}</p></div>
          {ROLES.map((r) => {
            const p = rolePiece(s, r); const thumb = pieceThumb(s, p);
            const st = p ? pieceStatus(s, p) : { state: "none" as const, confirmed: true };
            return (
              <div key={r} className="board-cell">
                <span className="cell-role mono">{ROLE_LABEL[r]}</span>
                <div className={`cell-thumb${thumb ? "" : " blank"}`}>{thumb ? <img src={thumb} alt="" loading="lazy" /> : <span>—</span>}</div>
                <StatusChip s={st} />
              </div>);
          })}
        </Link>
      ))}
    </div>
  );
}
