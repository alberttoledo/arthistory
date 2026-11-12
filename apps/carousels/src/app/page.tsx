import Link from "next/link";
import { asset, carousels } from "@/lib/data";

export default function Gallery() {
  return (
    <div className="grid">
      {carousels.map((c) => (
        <Link key={c.slug} className="card" href={`/c/${c.slug}/`}>
          <div className="img"><img src={asset(c.renders[0])} alt={`${c.title} cover`} loading="lazy" /></div>
          <div className="no mono">No. {c.no} · {c.renders.length} slides</div>
          <h2>{c.title}</h2>
          <p>{c.artist}, {c.year}</p>
        </Link>
      ))}
    </div>
  );
}
