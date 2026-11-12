import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Newsreader, IBM_Plex_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { ChannelSwitcher } from "@/components/ChannelSwitcher";
import { getChannels } from "@/lib/data";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--font-display" });
const body = Newsreader({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "Content Hub", template: "%s · Content Hub" },
  description: "Every teaser, film and carousel, what is final and what is published, and when each post goes out.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#0d0b09", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <header className="mast"><div className="wrap">
          <div>
            <div className="mono gold">Content Factory</div>
            <h1>Content <em>Hub</em></h1>
          </div>
          <div className="mast-right">
            <ChannelSwitcher channels={getChannels().map((c) => ({ slug: c.slug, name: c.name, count: c.stories.length }))} />
            <Nav />
          </div>
        </div></header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
