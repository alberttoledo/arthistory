import { notFound } from "next/navigation";
import Link from "next/link";
import { carousels, getCarousel, mdToHtml, tagLine } from "@/lib/data";
import { CopyButton } from "@/components/CopyButton";
import { Viewer } from "@/components/Viewer";

export const dynamicParams = false;
export function generateStaticParams() { return carousels.map((c) => ({ slug: c.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = getCarousel((await params).slug);
  return { title: c?.title ?? "Carousel" };
}

export default async function CarouselPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = getCarousel((await params).slug);
  if (!c) notFound();
  return (
    <div className="viewer">
      <Link className="back mono" href="/">← All carousels</Link>
      <Viewer c={c}>
        <div className="section"><h3 className="mono">Caption <CopyButton text={c.caption} /></h3><div className="caption">{c.caption}</div></div>
        <div className="section"><h3 className="mono">Hashtags <CopyButton text={tagLine(c)} /></h3><div className="tags">{tagLine(c)}</div></div>
        {c.slides.length > 0 && (
          <div className="section"><h3 className="mono">Running order</h3>
            <ol className="slidelist">{c.slides.map((s) => (
              <li key={s.n}><span className="n">{String(s.n).padStart(2, "0")}</span><span className="t">{s.type}</span><span>{s.headline}</span></li>))}
            </ol></div>)}
        {c.notes && <div className="section"><h3 className="mono">Notes</h3><p className="notes">{c.notes}</p></div>}
        {c.sources && <div className="section"><details><summary className="mono">Sources & image licences</summary>
          <div className="md" dangerouslySetInnerHTML={{ __html: mdToHtml(c.sources) }} /></details></div>}
      </Viewer>
    </div>
  );
}
