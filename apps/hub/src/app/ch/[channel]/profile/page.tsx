import { notFound } from "next/navigation";
import { ProfileMock, type Tile } from "@/components/ProfileMock";
import { asset, getCarousel, getChannel, getChannels, mediaUrl, profile } from "@/lib/data";
import { finalTake } from "@/lib/status";
import { ROLE_LABEL, storyHref } from "@/lib/view";

export const dynamicParams = false;
export const generateStaticParams = () => getChannels().map((c) => ({ channel: c.slug }));
export const metadata = { title: "Profile mock" };

export default async function ProfilePage({ params }: { params: Promise<{ channel: string }> }) {
  const ch = getChannel((await params).channel);
  if (!ch) notFound();
  if (!ch.stories.length) return (
    <div className="wrap"><p className="empty">No stories in {ch.name} yet, so there's nothing to mock up.</p></div>
  );

  // Rollout order (story 01 first, then teaser → film → carousel), posted oldest first; the grid shows newest first.
  const tiles: Tile[] = [];
  for (const s of ch.stories) {
    for (const role of ["teaser", "film", "carousel"] as const) {
      const piece = s.pieces.find((p) => p.id === s.rollout[role]);
      const base = { key: `${s.slug}-${role}`, no: s.no, title: s.title, role: ROLE_LABEL[role], href: storyHref(s) };
      if (role === "carousel") {
        const c = piece?.carousel ? getCarousel(piece.carousel) : undefined;
        if (c?.renders.length) tiles.push({ ...base, kind: "carousel", poster: asset(c.renders[0]), slides: c.renders.map(asset), caption: c.caption, hashtags: c.hashtags });
        else tiles.push({ ...base, kind: "missing" });
        continue;
      }
      const fin = piece ? finalTake(piece) : undefined;
      const video = fin ? mediaUrl(s, `${fin.id}.mp4`) : null;
      if (fin && video) tiles.push({ ...base, kind: "reel", video, poster: mediaUrl(s, `${fin.id}.jpg`) ?? undefined });
      else tiles.push({ ...base, kind: "missing" });
    }
  }
  tiles.reverse();

  return (
    <div className="wrap pf-page">
      <div className="pf-intro">
        <div className="mono gold">Instagram mock</div>
        <h2 className="bh">How <em>{ch.handle}</em> will look.</h2>
        <p className="intro">A preview of the profile with every teaser, film and carousel in rollout order, newest at the top. It isn't the real schedule. Tap a tile to open the post. Dashed tiles are pieces with no final yet.
          {ch.profile?.draft && <> The name and bio are drafts; edit them in <code>channels/{ch.slug}/channel.json</code>.</>}</p>
      </div>
      <ProfileMock handle={ch.handle.replace(/^@/, "")} profile={ch.profile} avatar={profile.portraits[0] ? asset(profile.portraits[0].src) : null} tiles={tiles} />
    </div>
  );
}
