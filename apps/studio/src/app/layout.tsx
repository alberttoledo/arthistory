import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { getStyle, listChannels } from "@cf/core";
import { NavLink } from "@/components/Nav";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });

export const metadata: Metadata = { title: "Content Factory Studio" };
export const dynamic = "force-dynamic";

// Every font a channel style may use, so style previews render in the real typeface.
const CHANNEL_FONTS = [
  "Anton", "Bebas+Neue", "Cinzel:wght@400;700", "Cormorant+Garamond:wght@400;700", "DM+Serif+Display",
  "Fraunces:wght@400;700", "IBM+Plex+Mono:wght@400;700", "Inter:wght@400;800", "Italiana",
  "Libre+Baskerville:wght@400;700", "Oswald:wght@400;700", "Playfair+Display:wght@400;700",
  "Space+Grotesk:wght@400;700", "Special+Elite", "Syne:wght@400;800",
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const channels = listChannels();
  return (
    <html lang="en" className={archivo.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${CHANNEL_FONTS.map((f) => `family=${f}`).join("&")}&display=swap`} />
      </head>
      <body>
        <div className="shell">
          <aside className="rail">
            <a href="/" className="wordmark">Content Factory<span>Studio</span></a>
            <nav className="nav" aria-label="Sections">
              <NavLink href="/" exact>Overview</NavLink>
              <NavLink href="/planner">Planner</NavLink>
              <NavLink href="/library">Library</NavLink>
              <NavLink href="/analytics">Analytics</NavLink>
              <NavLink href="/queue">Render queue</NavLink>
            </nav>
            <nav className="nav" aria-label="Channels">
              <div className="nav-group">Channels</div>
              {channels.map((c) => {
                const s = getStyle(c.slug);
                return (
                  <NavLink key={c.slug} href={`/c/${c.slug}`}>
                    <span className="chip" style={{ background: s.palette.bg, ["--chip-accent" as string]: s.palette.accent }} aria-hidden />
                    {c.name}
                  </NavLink>
                );
              })}
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
