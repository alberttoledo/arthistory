import Link from "next/link";
import { notFound } from "next/navigation";
import { TakeCard } from "@/components/TakeCard";
import { StatusChip } from "@/components/StatusChip";
import { asset, getCarousel, getChannels, getStory, mediaUrl, refFile } from "@/lib/data";
import type { Piece } from "@/lib/schema";
import { finalTake, pieceStatus } from "@/lib/status";
import { fmtLong } from "@/lib/time";
import { ROLE_LABEL } from "@/lib/view";

export const dynamicParams = false;
export const generateStaticParams = () => getChannels().flatMap((c) => c.stories.map((s) => ({ channel: c.slug, story: s.slug })));
export async function generateMetadata({ params }: { params: Promise<{ channel: string; story: string }> }) {
  const p = await params; return { title: getStory(p.channel, p.story)?.title ?? "Story" };
}

export default async function StoryPage({ params }: { params: Promise<{ channel: string; story: string }> }) {
  const p = await params;
  const s = getStory(p.channel, p.story);
  if (!s) notFound();
  const order: Piece[] = [s.rollout.teaser, s.rollout.film, s.rollout.carousel].map((id) => s.pieces.find((x) => x.id === id)).filter((x): x is Piece => !!x);
  const extras = s.pieces.filter((x) => !order.includes(x));
  const roleOf = (piece: Piece) => (["teaser", "film", "carousel"] as const).find((r) => s.rollout[r] === piece.id);
  const roles = (["teaser", "film", "carousel"] as const);

  return (
    <div className="story">
      <Link className="back mono" href={`/ch/${s.channel}/`}>← Rollouts</Link>
      <header className="story-head">
        <div className="mono gold">No. {s.no}</div>
        <h2>{s.title}</h2>
        <div className="muted">{[s.artist, s.year, s.museum].filter(Boolean).join(" · ")}</div>
        {s.note && <p className="story-note">{s.note}</p>}
        <ol className="rollout-line">{roles.map((r, i) => {
          const piece = s.pieces.find((x) => x.id === s.rollout[r]);
          return <li key={r}><span className="mono">{i + 1}. {ROLE_LABEL[r]}</span>{piece ? <StatusChip s={pieceStatus(s, piece)} /> : <span className="chip chip-none">Not made</span>}</li>;
        })}</ol>
      </header>

      {[...order, ...extras].map((piece) => {
        const role = roleOf(piece);
        const fin = finalTake(piece);
        const posts = s.posts.filter((x) => x.piece === piece.id);
        const car = piece.carousel ? getCarousel(piece.carousel) : undefined;
        return (
          <section key={piece.id} className="piece">
            <header>
              <div><span className="mono gold">{role ? ROLE_LABEL[role] : "Extra"}{piece.kind ? ` · ${piece.kind}` : ""}</span><h3>{piece.title}</h3></div>
              <StatusChip s={pieceStatus(s, piece)} />
            </header>
            {piece.note && <p className="muted">{piece.note}</p>}

            {car && (
              <div className="piece-carousel">
                <Link href={`/c/${car.slug}/`} className="car-strip">{car.renders.slice(0, 5).map((r) => <img key={r} src={asset(r)} alt="" loading="lazy" />)}</Link>
                <p><Link className="mono" href={`/c/${car.slug}/`}>Open the carousel · caption · downloads →</Link></p>
              </div>
            )}

            {!car && fin && (() => {
              const src = mediaUrl(s, `${fin.id}.mp4`); const poster = mediaUrl(s, `${fin.id}.jpg`) ?? undefined;
              return src ? (
                <div className="player"><video src={src} poster={poster} controls playsInline preload="metadata" />
                  <a className="mono" href={src} download>Download final</a></div>
              ) : <p className="notice">Final take chosen, but its web copy isn't built yet. Run <code>npm run media -w @cf/hub</code> on the Mac that has the raw file.</p>;
            })()}
            {!car && !fin && piece.takes.length > 0 && <p className="notice">No final take yet. The drafts are listed below.</p>}

            {piece.stills.length > 0 && (
              <div className="stills">{piece.stills.map((st) => {
                const u = mediaUrl(s, refFile(st));
                return <figure key={st}>{u ? <a href={u} target="_blank" rel="noopener"><img src={u} alt="" loading="lazy" /></a> : <span>not built</span>}<figcaption className="mono small">{st.split("/").pop()}</figcaption></figure>;
              })}</div>
            )}

            {piece.takes.length > 0 && (
              <details className="takes" open={!fin}>
                <summary className="mono">{piece.takes.length} take{piece.takes.length > 1 ? "s" : ""}</summary>
                <div className="take-list">{piece.takes.map((t) => <TakeCard key={t.id} story={s} piece={piece} take={t} />)}</div>
              </details>
            )}

            <div className="posts">
              <span className="mono muted">Posts</span>
              {posts.length ? <ul>{posts.map((x, i) => <li key={i}><span className={`chip chip-${x.status === "published" ? "published" : "scheduled"}`}>{x.status}</span> {fmtLong(x.at)} · {x.platform}{x.url && <> · <a href={x.url} target="_blank" rel="noopener">view post</a></>}</li>)}</ul>
                : <span className="muted"> Not scheduled.</span>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
