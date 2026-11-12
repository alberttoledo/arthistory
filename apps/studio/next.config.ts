import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@cf/core", "@cf/video"],
  turbopack: { root: path.join(import.meta.dirname, "../..") },
  devIndicators: false,
};
export default config;
