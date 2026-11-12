"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [{ href: "/", label: "Gallery" }, { href: "/wall/", label: "Wall" }, { href: "/brand/", label: "Brand" }];

export function Nav() {
  const path = usePathname() ?? "/";
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/c/") : path.startsWith(href.replace(/\/$/, "")));
  return (
    <nav className="tabs mono" aria-label="Views">
      {tabs.map((t) => <Link key={t.href} href={t.href} aria-current={active(t.href) ? "page" : undefined}>{t.label}</Link>)}
    </nav>
  );
}
