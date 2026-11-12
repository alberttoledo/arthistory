"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ChannelSwitcher({ channels }: { channels: { slug: string; name: string; count: number }[] }) {
  const path = usePathname() ?? "/";
  const cur = path.match(/^\/ch\/([^/]+)/)?.[1] ?? "art-history";
  const current = channels.find((c) => c.slug === cur) ?? channels[0];
  return (
    <details className="switcher">
      <summary className="mono">{current?.name} <span aria-hidden>▾</span></summary>
      <ul>{channels.map((c) => (
        <li key={c.slug}><Link href={`/ch/${c.slug}/`} aria-current={c.slug === cur ? "true" : undefined}
          onClick={(e) => (e.currentTarget.closest("details") as HTMLDetailsElement)?.removeAttribute("open")}>
          {c.name}<span className="mono muted">{c.count ? `${c.count} stories` : "empty"}</span></Link></li>))}
      </ul>
    </details>
  );
}
