// Reads a business's public website for the setup interview: the home page plus up to three same-site pages
// that look like a menu, price list, services, hours or FAQ. Public http(s) addresses only.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 1_500_000;
const INTERESTING = /(menu|price|pricing|service|treatment|product|shop|hour|opening|about|contact|faq|book|reserv|delivery|room|rate)/i;

function privateAddress(ip: string) {
  if (ip.includes(":")) {
    const v6 = ip.toLowerCase();
    return v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("::ffff:127.") || v6 === "::";
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function assertPublic(u: URL) {
  if (!/^https?:$/.test(u.protocol)) throw new Error("Use an http or https address.");
  if (u.username || u.password) throw new Error("That address can't include a login.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error("That address isn't public.");
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true })).map((r) => r.address);
  if (!ips.length || ips.some(privateAddress)) throw new Error("That address isn't public.");
}

async function get(u: URL): Promise<string | null> {
  await assertPublic(u);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(u, { signal: ctrl.signal, redirect: "manual", headers: { "user-agent": "JawabSetup/1.0 (+https://jawab.app)", accept: "text/html,text/plain" } });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const next = new URL(res.headers.get("location")!, u);
      await assertPublic(next);
      return get(next);
    }
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|text\/plain|application\/xhtml/.test(type)) return null;
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) break;
      chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
  } finally {
    clearTimeout(timer);
  }
}

export function htmlToText(html: string) {
  return html
    .replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function links(html: string, base: URL) {
  const out: URL[] = [];
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const u = new URL(m[1], base);
      if (u.hostname !== base.hostname) continue;
      if (!INTERESTING.test(u.pathname) && !INTERESTING.test(m[2])) continue;
      if (/\.(pdf|jpe?g|png|gif|webp|zip)$/i.test(u.pathname)) continue;
      u.hash = "";
      if (!out.some((x) => x.href === u.href) && u.href !== base.href) out.push(u);
    } catch {}
  }
  return out.slice(0, 3);
}

export async function readWebsite(raw: string): Promise<{ url: string; text: string }> {
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  const home = await get(url);
  if (!home) throw new Error("Couldn't open that website.");
  const parts = [`# ${url.href}\n${htmlToText(home).slice(0, 15_000)}`];
  for (const u of links(home, url)) {
    const html = await get(u).catch(() => null);
    if (html) parts.push(`# ${u.href}\n${htmlToText(html).slice(0, 10_000)}`);
  }
  return { url: url.href, text: parts.join("\n\n").slice(0, 40_000) };
}
