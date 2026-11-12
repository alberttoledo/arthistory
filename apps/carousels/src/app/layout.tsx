import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Newsreader, IBM_Plex_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { carousels, totalSlides } from "@/lib/data";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--font-display" });
const body = Newsreader({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "Story Carousels · Art History", template: "%s · Art History" },
  description: "Story carousels for the Art History channel's painting films.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#0d0b09", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <header className="mast"><div className="wrap">
          <div>
            <div className="mono gold">Art History · Carousel series</div>
            <h1>Story <em>Carousels</em></h1>
            <div className="sub mono">{carousels.length} paintings · {totalSlides} slides · 1080 × 1350</div>
          </div>
          <Nav />
        </div></header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
