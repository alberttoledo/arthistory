import { createContext, useContext } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { loadFont as anton } from "@remotion/google-fonts/Anton";
import { loadFont as bebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as cinzel } from "@remotion/google-fonts/Cinzel";
import { loadFont as cormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as dmSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as fraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as plexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as italiana } from "@remotion/google-fonts/Italiana";
import { loadFont as baskerville } from "@remotion/google-fonts/LibreBaskerville";
import { loadFont as oswald } from "@remotion/google-fonts/Oswald";
import { loadFont as playfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as spaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as specialElite } from "@remotion/google-fonts/SpecialElite";
import { loadFont as syne } from "@remotion/google-fonts/Syne";
import type { Style } from "../../core/src/schemas.ts";

type Loader = (style?: "normal", opts?: { weights?: string[]; subsets?: string[] }) => { fontFamily: string };

/** Fonts a style.json may name. Add a line here to support a new Google Font. */
export const FONTS: Record<string, Loader> = {
  "Anton": anton as Loader,
  "Bebas Neue": bebas as Loader,
  "Cinzel": cinzel as Loader,
  "Cormorant Garamond": cormorant as Loader,
  "DM Serif Display": dmSerif as Loader,
  "Fraunces": fraunces as Loader,
  "IBM Plex Mono": plexMono as Loader,
  "Inter": inter as Loader,
  "Italiana": italiana as Loader,
  "Libre Baskerville": baskerville as Loader,
  "Oswald": oswald as Loader,
  "Playfair Display": playfair as Loader,
  "Space Grotesk": spaceGrotesk as Loader,
  "Special Elite": specialElite as Loader,
  "Syne": syne as Loader,
};

const loaded = new Map<string, string>();

/** Any other Google Fonts family: load its stylesheet and hold the render until the face is ready. */
function loadGoogleFont(name: string): string {
  if (typeof document === "undefined") return `"${name}"`;
  const handle = delayRender(`Loading font ${name}`, { timeoutInMilliseconds: 20000 });
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;700;800&display=block`;
  const done = () => continueRender(handle);
  link.onload = () => {
    Promise.all([document.fonts.load(`400 40px "${name}"`), document.fonts.load(`700 40px "${name}"`)]).then(done, done);
  };
  // An unknown family (typo) must not hang the render; fall back to the default face.
  link.onerror = done;
  document.head.appendChild(link);
  return `"${name}", sans-serif`;
}

export function useFont(name: string): string {
  if (!loaded.has(name)) {
    const loader = FONTS[name];
    loaded.set(name, loader ? loader("normal", { subsets: ["latin"] }).fontFamily : loadGoogleFont(name));
  }
  return loaded.get(name)!;
}

export interface Theme {
  style: Style;
  display: string;
  body: string;
  src: (file: string) => string;
}

export const ThemeContext = createContext<Theme | null>(null);
export const useTheme = () => {
  const t = useContext(ThemeContext);
  if (!t) throw new Error("useTheme outside ThemeContext");
  return t;
};

export const makeSrc = (assetBase: string | null) => (file: string) =>
  assetBase === null ? staticFile(file) : `${assetBase.replace(/\/$/, "")}/${file}`;
