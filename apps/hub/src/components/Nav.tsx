"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const path = usePathname() ?? "/";
  const ch = path.match(/^\/ch\/([^/]+)/)?.[1] ?? "art-history";
  const tabs = [
    { href: `/ch/${ch}/`, label: "Rollouts", on: path === "/" || (path.startsWith(`/ch/${ch}`) && !path.includes("/calendar") && !path.includes("/profile")) },
    { href: `/ch/${ch}/profile/`, label: "Profile", on: path.includes("/profile") },
    { href: `/ch/${ch}/calendar/`, label: "Calendar", on: path.includes("/calendar") },
    { href: "/carousels/", label: "Carousels", on: path.startsWith("/carousels") || path.startsWith("/c/") },
    { href: "/wall/", label: "Wall", on: path.startsWith("/wall") },
    { href: "/brand/", label: "Brand", on: path.startsWith("/brand") },
  ];
  return (
    <nav className="tabs mono" aria-label="Views">
      {tabs.map((t) => <Link key={t.label} href={t.href} aria-current={t.on ? "page" : undefined}>{t.label}</Link>)}
    </nav>
  );
}
