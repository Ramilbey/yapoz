// Renders film.html to public/film/yapoz-60s.mp4 (1920x1080, 30fps) with music, sound effects and the voice-over,
// plus a poster (yapoz-60s.jpg) and a caption file (yapoz-60s.en.vtt).
// Needs ffmpeg and Google Chrome (a real GPU makes it about 20x faster); run `python3 film/voice.py` first if lines.json changed.
// Usage (from the repo root):
//   node film/render.mjs                    -> public/film/*
//   node film/render.mjs --stills 2,16,43   -> film/out/stills/*.png (quick visual check)
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const out = path.join(here, "out");
const pub = path.join(root, "public", "film");
mkdirSync(out, { recursive: true });
mkdirSync(pub, { recursive: true });

const FPS = 30;
const SUBFRAMES = Number(process.env.SUBFRAMES ?? 4);
const args = process.argv.slice(2);
const stillsArg = args.includes("--stills") ? args[args.indexOf("--stills") + 1] : null;

// The page loads three.js from node_modules, so serve the repo over http.
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".mp3": "audio/mpeg", ".css": "text/css", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) return void res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/film/film.html`;

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--force-device-scale-factor=1", "--hide-scrollbars", "--use-gl=angle", "--use-angle=gl", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("pageerror:", e.message));
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !/Clock|PCFSoft/.test(m.text()) && console.error("console:", m.text().slice(0, 300)));
await page.goto(url);
await page.evaluate(() => window.ready);
const DURATION = await page.evaluate(() => window.DURATION);

if (stillsArg) {
  mkdirSync(path.join(out, "stills"), { recursive: true });
  for (const t of stillsArg.split(",").map(Number)) {
    await page.evaluate(([x, n]) => window.renderFrame(x, n), [t, 1]);
    await page.screenshot({ path: path.join(out, "stills", `t${t.toFixed(2).padStart(6, "0")}.png`) });
    console.log("still", t);
  }
  await browser.close();
  server.close();
  process.exit(0);
}

// ---------- sound: music bed and effects ----------
const SFX = await page.evaluate(() => window.SFX);
const SR = 48000;
const total = Math.ceil((DURATION + 0.5) * SR);
const L = new Float32Array(total);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const add = (t0, len, fn) => {
  const s = Math.floor(t0 * SR);
  for (let i = 0; i < len * SR && s + i < total; i++) if (s + i >= 0) L[s + i] += fn(i / SR);
};
const sine = (f, x) => Math.sin(2 * Math.PI * f * x);
const synth = {
  ping: (t, g) => { add(t, 0.25, (x) => sine(1568, x) * Math.exp(-x * 18) * 0.11 * g); add(t + 0.07, 0.3, (x) => sine(2093, x) * Math.exp(-x * 16) * 0.09 * g); },
  pop: (t, g) => add(t, 0.12, (x) => sine(520 + 3000 * x, x) * Math.exp(-x * 38) * 0.16 * g),
  click: (t, g) => add(t, 0.03, (x) => rnd() * Math.exp(-x * 220) * 0.2 * g),
  tick: (t, g) => add(t, 0.04, (x) => sine(2600, x) * Math.exp(-x * 140) * 0.07 * g),
  thud: (t, g) => add(t, 0.55, (x) => sine(82 - 38 * x, x) * Math.exp(-x * 8) * 0.7 * g),
  ding: (t, g) => add(t, 2.8, (x) => [[1, 1, 1.6], [2.76, 0.45, 1.0], [5.4, 0.22, 0.5], [8.93, 0.1, 0.28]].reduce((a, [m, amp, d]) => a + sine(1046.5 * m, x) * amp * Math.exp(-x / d), 0) * 0.17 * g * Math.min(1, x * 400)),
  alert: (t, g) => { add(t, 0.14, (x) => sine(740, x) * Math.exp(-x * 14) * 0.14 * g); add(t + 0.14, 0.22, (x) => sine(554, x) * Math.exp(-x * 10) * 0.14 * g); },
  whoosh: (t, g) => { let y = 0; add(t, 0.8, (x) => { const env = Math.sin(Math.PI * Math.min(1, x / 0.8)) ** 2; y += (0.02 + 0.25 * env) * (rnd() - y); return y * env * 0.5 * g; }); },
  type: (t, g) => { for (let i = 0; i < 40; i++) synth.click(t + i * 0.07 + (i % 3) * 0.011, g * 0.7); },
  scan: (t, g) => { let y = 0; add(t, 2.2, (x) => { const k = 0.01 + 0.1 * (x / 2.2); y += k * (rnd() - y); return y * 0.12 * Math.sin((Math.PI * x) / 2.2) * g + sine(300 + 700 * (x / 2.2), x) * 0.012 * g; }); },
};
for (const { type, t, gain } of SFX) synth[type]?.(t, gain ?? 1);

// Music: a low drone for the late-night opening, then a slow pulse (96 BPM) under Am–F–C–G once Yapoz appears.
const BEAT = 60 / 96;
const CHORDS = [[110, 130.81, 164.81], [87.31, 110, 130.81], [130.81, 164.81, 196], [98, 123.47, 146.83]];
const dip = (x) => (x > 51.3 && x < 54.4 ? 0.3 : 1);
for (let i = 0; i < total; i++) {
  const x = i / SR;
  const fadeIn = Math.min(1, x / 1.5), fadeOut = Math.min(1, Math.max(0, (DURATION - x) / 1.4));
  let v = 0;
  if (x < 16.4) {
    const thin = x > 13.4 ? Math.max(0.2, 1 - (x - 13.4) / 2.6) : 1;
    v += (sine(55, x) * 0.5 + sine(82.41, x) * 0.3 + sine(110.3, x) * 0.12) * (0.75 + 0.25 * sine(0.2, x)) * 0.07 * thin;
  } else {
    const ci = Math.floor((x - 16.4) / (BEAT * 8)) % 4;
    const swell = Math.min(1, (x - 16.4) / 1.4);
    for (const f of CHORDS[ci]) v += (sine(f, x) + 0.5 * sine(f * 2.003, x) + 0.25 * sine(f * 3.01, x)) * 0.02 * swell;
    v += sine(CHORDS[ci][0] / 2, x) * 0.045 * swell;
    v *= dip(x);
  }
  L[i] += v * fadeIn * fadeOut;
}
for (let b = 0; ; b++) {
  const t = 16.7 + b * BEAT;
  if (t > 57.5) break;
  const g = t > 51.3 && t < 54.4 ? 0.3 : 1;
  add(t, 0.3, (x) => sine(70 - 30 * x, x) * Math.exp(-x * 14) * 0.26 * g);
  add(t + BEAT / 2, 0.04, (x) => rnd() * Math.exp(-x * 160) * 0.03 * g);
}
for (const f of [220, 261.63, 329.63, 440]) add(57.2, 4.8, (x) => sine(f, x) * Math.exp(-x / 2.4) * 0.03 * Math.min(1, x * 30));

const bed = path.join(out, "bed.wav");
const buf = Buffer.alloc(44 + total * 2);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + total * 2, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(total * 2, 40);
for (let i = 0; i < total; i++) buf.writeInt16LE((Math.max(-1, Math.min(1, Math.tanh(L[i] * 1.1))) * 32000) | 0, 44 + i * 2);
writeFileSync(bed, buf);

// ---------- frames ----------
const master = path.join(out, "frames.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", master], { stdio: ["pipe", "inherit", "inherit"] });
const frames = Math.round(DURATION * FPS);
const t0 = Date.now();
for (let f = 0; f < frames; f++) {
  await page.evaluate(([x, n]) => window.renderFrame(x, n), [f / FPS, SUBFRAMES]);
  const img = await page.screenshot({ type: "jpeg", quality: 94 });
  if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once("drain", r));
  // Poster: the Yapoz reveal, with the wordmark risen and the bell still glowing.
  if (f === Math.round(18.4 * FPS)) await page.screenshot({ path: path.join(pub, "yapoz-60s.jpg"), type: "jpeg", quality: 84 });
  if (f % 150 === 0) console.log(`frame ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));

// Caption file for the page's <video>.
const cues = await page.evaluate(() => window.cues());
const ts = (s) => new Date(s * 1000).toISOString().slice(11, 23);
writeFileSync(path.join(pub, "yapoz-60s.en.vtt"), "WEBVTT\n\n" + cues.map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)}\n${c.text}\n`).join("\n"));
await browser.close();
server.close();

// ---------- mix and encode ----------
const { encode } = await import("./encode.mjs");
await encode();
