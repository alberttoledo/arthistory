import Link from "next/link";
import { asset, carousels } from "@/lib/data";

export const metadata = { title: "Wall" };

export default function Wall() {
  return (
    <div className="wall">
      {carousels.map((c) => (
        <section className="row" key={c.slug}>
          <h2><span className="mono gold">No. {c.no}</span><Link href={`/c/${c.slug}/`}>{c.title}</Link>
            <a className="zip mono" href={asset(c.zip)} download>Download .zip</a></h2>
          <div className="rowtrack">{c.renders.map((r, i) => <img key={r} src={asset(r)} alt={`${c.title} slide ${i + 1}`} loading="lazy" />)}</div>
        </section>
      ))}
    </div>
  );
}
