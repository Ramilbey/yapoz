// Mixes the rendered frames (out/frames.mp4) with the music bed and the voice-over into public/film/yapoz-60s.mp4.
// Run on its own to re-encode without re-rendering:  node film/encode.mjs   (CRF=26 for a larger, cleaner file)
import { spawn } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const out = path.join(here, "out");
const pub = path.join(root, "public", "film");
const DURATION = 60;
const master = path.join(out, "frames.mp4");
const bed = path.join(out, "bed.wav");
const CRF = process.env.CRF ?? "28";

export async function encode() {
  const t0 = Date.now();
  const lines = JSON.parse(readFileSync(path.join(here, "lines.json"), "utf8"));
  const inputs = ["-i", master, "-i", bed, ...lines.flatMap((l) => ["-i", path.join(here, "voice", `${l.id}.mp3`)])];
  const delays = lines.map((l, i) => `[${i + 2}:a]adelay=${Math.round(l.at * 1000)}|${Math.round(l.at * 1000)},aresample=48000[v${i}]`);
  const filter = [
    ...delays,
    `${lines.map((_, i) => `[v${i}]`).join("")}amix=inputs=${lines.length}:normalize=0,volume=1.15[vo]`,
    "[vo]asplit=2[voa][vosc]",
    "[1:a]aresample=48000,volume=0.9[bed]",
    "[bed][vosc]sidechaincompress=threshold=0.04:ratio=5:attack=15:release=350[duck]",
    "[duck][voa]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,apad[aout]",
  ].join(";");
  const final = path.join(pub, "yapoz-60s.mp4");
  await new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", filter, "-map", "0:v", "-map", "[aout]", "-c:v", "libx264", "-preset", "slow", "-crf", CRF, "-tune", "animation", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ac", "2", "-t", String(DURATION), "-movflags", "+faststart", final], { stdio: "inherit" });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
  });
  console.log(`done: ${path.relative(root, final)} (${(statSync(final).size / 1e6).toFixed(1)} MB) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

}

if (process.argv[1] === fileURLToPath(import.meta.url)) await encode();
