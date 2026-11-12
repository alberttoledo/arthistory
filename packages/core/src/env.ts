import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./store.ts";

/** Load <root>/.env once (Node's built-in loader; existing env vars win). */
let loaded = false;
export function loadEnv() {
  if (loaded) return;
  loaded = true;
  const file = path.join(ROOT, ".env");
  if (fs.existsSync(file)) process.loadEnvFile(file);
}
