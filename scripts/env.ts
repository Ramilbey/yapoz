// Load .env.local / .env for scripts run with tsx (Next.js loads these itself).
import { existsSync, readFileSync } from "node:fs";
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, raw] = m;
    if (process.env[k] !== undefined) continue;
    // Tests stub the network; the real gateway key must never reach them.
    if (process.env.NODE_TEST_CONTEXT && k.startsWith("KRACKEDDEVS_")) continue;
    process.env[k] = raw.replace(/^["']|["']$/g, "");
  }
}
