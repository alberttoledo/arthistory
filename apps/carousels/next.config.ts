import path from "node:path";
import type { NextConfig } from "next";

// GitHub Pages serves the site under /<repo-name>; the workflow passes that in PAGES_BASE_PATH.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const config: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  turbopack: { root: path.join(import.meta.dirname, "../..") },
  devIndicators: false,
};
export default config;
