import type { Piece, Take } from "@/lib/schema";
import { mediaUrl, refFile, type StoryWithMedia } from "@/lib/data";
import { takeLineage } from "@/lib/status";

const res = (t: Take) => (t.width && t.height ? `${Math.min(t.width, t.height)}p` : null);

export function TakeCard({ story, piece, take }: { story: StoryWithMedia; piece: Piece; take: Take }) {
  const thumb = mediaUrl(story, `${take.id}.thumb.jpg`);
  const lineage = takeLineage(piece, take);
  const meta = [res(take), take.seconds && `${take.seconds}s`, take.generated].filter(Boolean).join(" · ");
  return (
    <div className={`take${take.final ? " is-final" : ""}`}>
      <div className="take-thumb">{thumb ? <img src={thumb} alt="" loading="lazy" /> : <span>no preview</span>}</div>
      <div className="take-body">
        <div className="take-top">
          <b>{take.label ?? take.id}</b>
          {take.final && <span className={`chip chip-final`}>Final{!take.confirmed && <i> · unconfirmed</i>}</span>}
        </div>
        <div className="mono muted">{meta}</div>
        {take.note && <p className="take-note">{take.note.length > 280 ? take.note.slice(0, 280) + "…" : take.note}</p>}
        <details className="how">
          <summary className="mono">How it was made</summary>
          {lineage.map((t, i) => (
            <div key={t.id} className="how-step">
              <div className="mono gold">{i === 0 ? "This take" : `Made from: ${t.label ?? t.id}`}</div>
              <dl>
                <dt>Tool</dt><dd>{t.tool ?? "Unknown"}{t.process ? ` · ${t.process}` : ""}</dd>
                {t.settings && <><dt>Settings</dt><dd>{t.settings}</dd></>}
                {!t.process && <><dt>Prompt</dt><dd>{t.prompt ? <pre>{t.prompt}</pre> : "Unknown"}</dd></>}
                {t.refs.length > 0 && <><dt>References</dt><dd className="refs">{t.refs.map((r) => {
                  const u = mediaUrl(story, refFile(r));
                  return <figure key={r}>{u ? <a href={u} target="_blank" rel="noopener"><img src={u} alt="" /></a> : null}<figcaption>{r.split("/").pop()}</figcaption></figure>;
                })}</dd></>}
                {t.source && <><dt>Source</dt><dd className="mono small">{t.source}</dd></>}
                <dt>File</dt><dd className="mono small">{t.file}</dd>
              </dl>
            </div>
          ))}
        </details>
      </div>
    </div>
  );
}
