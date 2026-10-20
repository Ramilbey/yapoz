// Downloads General Sans (Fontshare, free for commercial use) into public/fonts/general-sans.
// Fontshare's licence doesn't allow redistributing the files in a repo, so each install fetches them.
import { mkdirSync, writeFileSync } from "node:fs";
import { unzipSync } from "fflate";

const url = "https://api.fontshare.com/v2/fonts/download/general-sans";
const res = await fetch(url);
if (!res.ok) {
  console.error(`Couldn't download General Sans (${res.status}). The site falls back to Bricolage Grotesque.`);
  process.exit(0);
}
const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
mkdirSync("public/fonts/general-sans", { recursive: true });
let n = 0;
for (const [name, data] of Object.entries(files)) {
  const base = name.split("/").pop();
  if (base === "GeneralSans-Variable.woff2" || base === "GeneralSans-VariableItalic.woff2") {
    writeFileSync(`public/fonts/general-sans/${base}`, data);
    n++;
  }
}
console.log(n ? `Saved ${n} General Sans file(s).` : "General Sans archive had no variable woff2 files; falling back to Bricolage.");
