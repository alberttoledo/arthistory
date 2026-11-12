import { notFound } from "next/navigation";
import { Calendar, type CalItem } from "@/components/Calendar";
import { getChannel, getChannels } from "@/lib/data";
import { pieceStatus } from "@/lib/status";
import { ROLE_LABEL, storyHref } from "@/lib/view";

export const dynamicParams = false;
export const generateStaticParams = () => getChannels().map((c) => ({ channel: c.slug }));
export const metadata = { title: "Calendar" };

export default async function CalendarPage({ params }: { params: Promise<{ channel: string }> }) {
  const ch = getChannel((await params).channel);
  if (!ch) notFound();
  const items: CalItem[] = []; const ready: { label: string; href: string }[] = [];
  for (const s of ch.stories) {
    for (const post of s.posts) {
      const piece = s.pieces.find((x) => x.id === post.piece);
      const role = (["teaser", "film", "carousel"] as const).find((r) => s.rollout[r] === post.piece);
      items.push({ at: post.at, status: post.status, role: role ?? "extra", title: `${s.title} · ${role ? ROLE_LABEL[role] : piece?.title ?? post.piece}`, href: storyHref(s) });
    }
    for (const r of ["teaser", "film", "carousel"] as const) {
      const piece = s.pieces.find((x) => x.id === s.rollout[r]);
      if (piece && pieceStatus(s, piece).state === "final") ready.push({ label: `${s.title} · ${ROLE_LABEL[r]}`, href: storyHref(s) });
    }
  }
  return (
    <div className="calendar-page">
      <div className="pagehead"><h2>{ch.name} <em>calendar</em></h2><p className="mono muted">Times in {ch.timezone}</p></div>
      <Calendar items={items} />
      <section className="ready">
        <h3>Ready to schedule <span className="mono muted">{ready.length}</span></h3>
        {ready.length ? <ul>{ready.map((r) => <li key={r.label}><a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${r.href}`}>{r.label}</a></li>)}</ul>
          : <p className="muted">Nothing final and unscheduled.</p>}
        <p className="muted small">To schedule a post, ask Claude in a session (“put the Night Watch film on Tue 18 Nov at 18:00”). It's saved in the story file and appears here after the site redeploys.</p>
      </section>
    </div>
  );
}
