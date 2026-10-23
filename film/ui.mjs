// The screens inside the film: lock screen, WhatsApp / Telegram / Instagram chats, and the Yapoz owner's Orders and Needs-you views.
// Each draw function paints a phone-sized canvas (390 x 823 logical points) for a given time.
import { PALETTE as P, clamp, ease, rr, wrapText, SCREEN_PX } from "./kit.mjs";

export const LW = 390;
export const LH = SCREEN_PX.h / (SCREEN_PX.w / LW);
const F = '"Familjen Grotesk"';
const A = '"Anybody"';
const M = '"Martian Mono"';

const begin = (ctx) => {
  ctx.setTransform(SCREEN_PX.w / LW, 0, 0, SCREEN_PX.w / LW, 0, 0);
  ctx.textBaseline = "alphabetic";
  ctx.fontStretch = "normal";
  ctx.letterSpacing = "0px";
  ctx.globalAlpha = 1;
};
const font = (ctx, size, weight = 400, fam = F, style = "normal", stretch = "normal") => {
  ctx.font = `${style} ${weight} ${size}px ${fam}`;
  ctx.fontStretch = stretch;
};

// ---------- little icons ----------
const back = (ctx, x, y, c, w = 2.2) => {
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + 7, y - 9);
  ctx.lineTo(x - 1, y);
  ctx.lineTo(x + 7, y + 9);
  ctx.stroke();
};
const ticks = (ctx, x, y, c) => {
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 3.2, y + 3.4);
  ctx.lineTo(x + 9, y - 3.6);
  ctx.moveTo(x + 5.2, y + 3);
  ctx.lineTo(x + 5.9, y + 3.6);
  ctx.lineTo(x + 11.8, y - 3.6);
  ctx.stroke();
};
const dotsV = (ctx, x, y, c) => {
  ctx.fillStyle = c;
  for (const dy of [-6, 0, 6]) {
    ctx.beginPath();
    ctx.arc(x, y + dy, 1.8, 0, 6.3);
    ctx.fill();
  }
};
const mic = (ctx, x, y, c, w = 1.8) => {
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  rr(ctx, x - 3.5, y - 9, 7, 13, 3.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - 1, 8, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.moveTo(x, y + 7.5);
  ctx.lineTo(x, y + 11);
  ctx.stroke();
};
const videoIcon = (ctx, x, y, c) => {
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = "round";
  rr(ctx, x - 11, y - 7, 15, 14, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 2);
  ctx.lineTo(x + 11, y - 6);
  ctx.lineTo(x + 11, y + 6);
  ctx.lineTo(x + 4, y + 2);
  ctx.stroke();
};
const statusBar = (ctx, color, time = "23:47") => {
  font(ctx, 15, 600);
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.fillText(time, 30, 31);
  ctx.fillStyle = "#000";
  rr(ctx, LW / 2 - 58, 12, 116, 32, 16);
  ctx.fill();
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    rr(ctx, 300 + i * 6, 31 - (i + 1) * 3.2, 4, (i + 1) * 3.2 + 1, 1);
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  rr(ctx, 331, 20, 26, 12, 3.5);
  ctx.stroke();
  rr(ctx, 333, 22, 17, 8, 2);
  ctx.fill();
};
const homeBar = (ctx, color) => {
  ctx.fillStyle = color;
  rr(ctx, LW / 2 - 66, LH - 14, 132, 5, 2.5);
  ctx.fill();
};

// ---------- chats ----------
const APPS = {
  whatsapp: {
    bg: "#0B141A",
    head: "#1F2C34",
    ink: "#E9EDEF",
    sub: "#8696A0",
    me: "#005C4B",
    biz: "#202C33",
    input: "#1F2C34",
    typing: "#25D366",
  },
  telegram: { bg: "#0E1621", head: "#17212B", ink: "#F5F5F5", sub: "#6D7F8F", me: "#2B5278", biz: "#182533", input: "#17212B", typing: "#6AB2F2" },
  instagram: { bg: "#000000", head: "#000000", ink: "#FFFFFF", sub: "#A8A8A8", me: "grad", biz: "#262626", input: "#000000", typing: "#A8A8A8" },
};

function avatar(ctx, x, y, r, label, kind) {
  if (kind === "instagram") {
    const g = ctx.createLinearGradient(x - r, y + r, x + r, y - r);
    g.addColorStop(0, "#7B3FF2");
    g.addColorStop(0.5, "#D62976");
    g.addColorStop(1, "#3B82F6");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x, y, r - 2.5, 0, 6.3);
    ctx.fill();
  } else if (kind === "telegram") {
    const g = ctx.createLinearGradient(x - r, y + r, x + r, y - r);
    g.addColorStop(0, P.cobalt);
    g.addColorStop(1, P.mint);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.3);
    ctx.fill();
  } else {
    ctx.fillStyle = P.cobalt;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.3);
    ctx.fill();
  }
  ctx.fillStyle = kind === "telegram" ? P.ink : "#fff";
  font(ctx, r * 0.78, 700);
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + r * 0.28);
}

function header(ctx, app, kind, typing, extra = {}) {
  const c = APPS[kind];
  ctx.fillStyle = c.head;
  ctx.fillRect(0, 0, LW, 110);
  if (kind === "instagram") {
    ctx.fillStyle = "#262626";
    ctx.fillRect(0, 109, LW, 1);
  }
  statusBar(ctx, c.ink, extra.time);
  const name = kind === "instagram" ? "forno.sette" : "Forno Sette";
  if (kind === "whatsapp") {
    back(ctx, 24, 80, c.ink);
    avatar(ctx, 64, 80, 17, "FS", kind);
    ctx.textAlign = "left";
    font(ctx, 17, 500);
    ctx.fillStyle = c.ink;
    ctx.fillText(name, 92, 77);
    font(ctx, 12.5, 400);
    ctx.fillStyle = typing ? c.typing : c.sub;
    ctx.fillText(extra.status || (typing ? "typing…" : "online"), 92, 95);
    videoIcon(ctx, 306, 80, c.ink);
    dotsV(ctx, 350, 80, c.ink);
  } else if (kind === "telegram") {
    back(ctx, 20, 80, "#6AB2F2");
    ctx.fillStyle = "#2B5278";
    rr(ctx, 36, 70, 20, 17, 8.5);
    ctx.fill();
    ctx.fillStyle = "#fff";
    font(ctx, 11, 700);
    ctx.textAlign = "center";
    ctx.fillText("3", 46, 83);
    ctx.fillStyle = c.ink;
    font(ctx, 17, 600);
    ctx.fillText(name, LW / 2, 77);
    font(ctx, 12.5, 400);
    ctx.fillStyle = typing ? c.typing : c.sub;
    ctx.fillText(typing ? "typing…" : extra.status || "bot", LW / 2, 95);
    avatar(ctx, 350, 78, 18, "FS", kind);
  } else {
    back(ctx, 24, 80, c.ink);
    avatar(ctx, 66, 80, 18, "FS", kind);
    ctx.textAlign = "left";
    font(ctx, 15.5, 600);
    ctx.fillStyle = c.ink;
    ctx.fillText(name, 94, 77);
    font(ctx, 12, 400);
    ctx.fillStyle = c.sub;
    ctx.fillText(typing ? "typing…" : extra.status || "Active now", 94, 94);
    ctx.strokeStyle = c.ink;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(278, 71);
    ctx.lineTo(284, 71);
    ctx.lineTo(287, 78);
    ctx.lineTo(284, 81);
    ctx.quadraticCurveTo(287, 88, 293, 90);
    ctx.lineTo(296, 87);
    ctx.lineTo(303, 90);
    ctx.lineTo(303, 96);
    ctx.quadraticCurveTo(284, 96, 278, 71);
    ctx.stroke();
    videoIcon(ctx, 342, 80, c.ink);
  }
}

function inputBar(ctx, kind) {
  const c = APPS[kind];
  const y = LH - 72;
  if (kind === "whatsapp") {
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, y - 4, LW, 80);
    ctx.fillStyle = c.input;
    rr(ctx, 12, y + 4, 304, 44, 22);
    ctx.fill();
    ctx.fillStyle = c.sub;
    font(ctx, 16, 400);
    ctx.textAlign = "left";
    ctx.fillText("Message", 52, y + 32);
    ctx.strokeStyle = c.sub;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(32, y + 26, 9, 0, 6.3);
    ctx.moveTo(27, y + 29);
    ctx.quadraticCurveTo(32, y + 35, 37, y + 29);
    ctx.stroke();
    ctx.fillStyle = "#00A884";
    ctx.beginPath();
    ctx.arc(346, y + 26, 23, 0, 6.3);
    ctx.fill();
    mic(ctx, 346, y + 27, c.bg);
  } else if (kind === "telegram") {
    ctx.fillStyle = c.input;
    ctx.fillRect(0, y - 6, LW, 90);
    ctx.fillStyle = c.sub;
    font(ctx, 16, 400);
    ctx.textAlign = "left";
    ctx.fillText("Message", 50, y + 30);
    ctx.strokeStyle = c.sub;
    ctx.lineWidth = 1.7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(26, y + 24, 9, 0.9, 5.4);
    ctx.stroke();
    mic(ctx, 358, y + 26, c.sub);
  } else {
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, y - 4, LW, 80);
    ctx.strokeStyle = "#363636";
    ctx.lineWidth = 1.2;
    rr(ctx, 12, y + 4, 366, 44, 22);
    ctx.stroke();
    ctx.fillStyle = "#3B82F6";
    ctx.beginPath();
    ctx.arc(34, y + 26, 16, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.6;
    rr(ctx, 26, y + 20, 16, 12, 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(34, y + 26, 3.2, 0, 6.3);
    ctx.stroke();
    ctx.fillStyle = c.sub;
    font(ctx, 16, 400);
    ctx.textAlign = "left";
    ctx.fillText("Message...", 62, y + 32);
    mic(ctx, 330, y + 27, c.ink, 1.6);
  }
}

function bubble(ctx, kind, who, lines, w, h, x, y, p, time) {
  const c = APPS[kind];
  ctx.save();
  ctx.globalAlpha = p;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy + (1 - p) * 14);
  ctx.scale(0.94 + 0.06 * p, 0.94 + 0.06 * p);
  ctx.translate(-cx, -cy);
  if (kind === "instagram" && who === "me") {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#7B3FF2");
    g.addColorStop(1, "#3B82F6");
    ctx.fillStyle = g;
  } else ctx.fillStyle = who === "me" ? c.me : c.biz;
  const r = kind === "instagram" ? 20 : kind === "telegram" ? 15 : 10;
  const tail = kind === "instagram" ? 20 : kind === "telegram" ? 4 : 2;
  const radii = who === "me" ? [r, kind === "whatsapp" ? tail : r, kind === "instagram" ? r : tail, r] : [kind === "whatsapp" ? tail : r, r, r, kind === "instagram" ? r : tail];
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radii);
  ctx.fill();
  ctx.fillStyle = c.ink;
  font(ctx, 15.5, 400);
  ctx.textAlign = "left";
  const padX = kind === "instagram" ? 14 : 12;
  lines.forEach((l, i) => ctx.fillText(l, x + padX, y + 25 + i * 20));
  if (kind !== "instagram") {
    font(ctx, 11, 400);
    ctx.fillStyle = kind === "whatsapp" ? "#8696A0" : who === "me" ? "#8DB5E0" : "#6D7F8F";
    ctx.textAlign = "right";
    const tx = x + w - (who === "me" ? 26 : 10);
    ctx.fillText(time, tx, y + h - 8);
    if (who === "me") ticks(ctx, x + w - 22, y + h - 11, kind === "whatsapp" ? "#53BDEB" : "#6AB2F2");
  }
  ctx.restore();
}

/**
 * script: [{ who: "me" | "biz", text, at, typeFrom?, time? }] in the film's global seconds.
 * opts.t0: nothing before this is drawn; opts.seenAt: Instagram "Seen" label time; opts.status: header status override.
 */
export function drawChat(ctx, kind, t, script, opts = {}) {
  begin(ctx);
  const c = APPS[kind];
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, LW, LH);
  if (kind === "whatsapp") {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let y = 124; y < LH; y += 22) for (let x = (y / 22) % 2 ? 6 : 17; x < LW; x += 22) ctx.fillRect(x, y, 1.4, 1.4);
  } else if (kind === "telegram") {
    const g = ctx.createRadialGradient(80, 150, 10, 80, 150, 340);
    g.addColorStop(0, "rgba(63,91,255,0.16)");
    g.addColorStop(1, "rgba(63,91,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 110, LW, LH);
  }

  // layout (bottom-anchored)
  font(ctx, 15.5, 400);
  const maxW = 262;
  const items = [];
  let typingWho = null;
  let typingFrom = 0;
  for (const m of script) {
    if (m.typeFrom != null && t >= m.typeFrom && t < m.at) {
      typingWho = m.who;
      typingFrom = m.typeFrom;
    }
    if (t < m.at) continue;
    const lines = wrapText(ctx, m.text, maxW - 26);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const last = ctx.measureText(lines[lines.length - 1]).width;
    const timeW = kind === "instagram" ? 0 : (m.who === "me" ? 52 : 38) + 6;
    const extraRow = kind !== "instagram" && last + timeW > maxW - 26 ? 1 : 0;
    const w = Math.min(maxW, Math.max(widest, kind === "instagram" ? 0 : extraRow ? 0 : last + timeW) + 26);
    const h = (kind === "instagram" ? 11 : 10) * 2 + lines.length * 20 + (extraRow ? 15 : 0);
    items.push({ m, lines, w: Math.max(w, 56), h: Math.max(h, 38), p: ease.out(clamp((t - m.at) / 0.3)) });
  }
  const bottom = LH - 84;
  let y = bottom;
  const typingRow = typingWho ? { who: typingWho, p: ease.out(clamp((t - typingFrom) / 0.2)) } : null;
  if (typingRow) {
    const w = 62;
    const h = 38;
    y -= (h + 7) * typingRow.p;
    ctx.save();
    ctx.globalAlpha = typingRow.p;
    ctx.fillStyle = typingRow.who === "me" ? c.me === "grad" ? "#5b4ff0" : c.me : c.biz;
    const r = kind === "instagram" ? 20 : 14;
    ctx.beginPath();
    ctx.roundRect(typingRow.who === "me" ? LW - 14 - w : 14, y, w, h, r);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 7 - i * 0.9));
      ctx.fillStyle = `rgba(200,210,225,${a})`;
      ctx.beginPath();
      ctx.arc((typingRow.who === "me" ? LW - 14 - w : 14) + 19 + i * 12, y + h / 2 - Math.max(0, Math.sin(t * 7 - i * 0.9)) * 2, 3.2, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
  }
  const placed = [];
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    y -= (it.h + 7) * it.p;
    placed.push({ it, y });
  }
  if (kind === "whatsapp") {
    const first = placed[placed.length - 1];
    if (first) {
      const cy = first.y - 38;
      ctx.fillStyle = "#182229";
      font(ctx, 12, 500);
      const tw = ctx.measureText("TODAY").width;
      rr(ctx, LW / 2 - tw / 2 - 11, cy, tw + 22, 24, 7);
      ctx.fill();
      ctx.fillStyle = "#8696A0";
      ctx.textAlign = "center";
      ctx.fillText("TODAY", LW / 2, cy + 16.5);
    }
  }
  // clip the message area so old messages slide under the header
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 110, LW, LH);
  ctx.clip();
  for (const { it, y: py } of placed) {
    const x = it.m.who === "me" ? LW - 14 - it.w : 14;
    bubble(ctx, kind, it.m.who, it.lines, it.w, it.h, x, py, it.p, it.m.time || "23:47");
  }
  if (kind === "instagram" && opts.seenAt != null && t >= opts.seenAt && placed.length) {
    const lastMe = placed.find((p) => p.it.m.who === "me");
    if (lastMe && placed[0].it.m.who === "me") {
      font(ctx, 11.5, 400);
      ctx.fillStyle = "#A8A8A8";
      ctx.textAlign = "right";
      ctx.globalAlpha = ease.out(clamp((t - opts.seenAt) / 0.3));
      ctx.fillText("Seen", LW - 16, placed[0].y + placed[0].it.h + 14);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
  header(ctx, null, kind, typingWho === "biz", { status: opts.status });
  inputBar(ctx, kind);
  homeBar(ctx, kind === "whatsapp" ? "#E9EDEF55" : "#ffffff55");
}

// ---------- the lock screen and notifications ----------
export const APP_ICON = {
  whatsapp: { name: "WhatsApp", bg: "#25D366" },
  telegram: { name: "Telegram", bg: "#2AABEE" },
  instagram: { name: "Instagram", bg: "#D62976" },
};
function appIcon(ctx, app, x, y, s) {
  if (app === "instagram") {
    const g = ctx.createLinearGradient(x, y + s, x + s, y);
    g.addColorStop(0, "#7B3FF2");
    g.addColorStop(0.55, "#D62976");
    g.addColorStop(1, "#F5A623");
    ctx.fillStyle = g;
  } else ctx.fillStyle = APP_ICON[app].bg;
  rr(ctx, x, y, s, s, s * 0.24);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = s * 0.07;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const cx = x + s / 2;
  const cy = y + s / 2;
  if (app === "whatsapp") {
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.02, s * 0.28, 0, 6.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.24, cy + s * 0.12);
    ctx.lineTo(cx - s * 0.3, cy + s * 0.32);
    ctx.lineTo(cx - s * 0.1, cy + s * 0.24);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.02, s * 0.12, 3.6, 5.5);
    ctx.lineWidth = s * 0.1;
    ctx.stroke();
  } else if (app === "telegram") {
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.28, cy - s * 0.22);
    ctx.lineTo(cx - s * 0.3, cy);
    ctx.lineTo(cx - s * 0.06, cy + s * 0.06);
    ctx.lineTo(cx - s * 0.02, cy + s * 0.26);
    ctx.lineTo(cx + s * 0.08, cy + s * 0.1);
    ctx.stroke();
  } else {
    rr(ctx, cx - s * 0.26, cy - s * 0.26, s * 0.52, s * 0.52, s * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.12, 0, 6.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + s * 0.16, cy - s * 0.16, s * 0.025, 0, 6.3);
    ctx.fill();
  }
}
/** One notification card at (x, y), 358 wide. */
export function notifCard(ctx, n, x, y, alpha = 1, w = 358) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(34,40,58,0.86)";
  rr(ctx, x, y, w, 80, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();
  appIcon(ctx, n.app, x + 14, y + 14, 30);
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff";
  font(ctx, 15, 600);
  ctx.fillText(n.name, x + 56, y + 30);
  font(ctx, 14, 400);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText(n.text, x + 56, y + 54);
  font(ctx, 12, 400);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "right";
  ctx.fillText(n.when || "now", x + w - 14, y + 30);
  ctx.restore();
}
export function drawLock(ctx, t, notifs, opts = {}) {
  begin(ctx);
  const g = ctx.createLinearGradient(0, 0, LW, LH);
  g.addColorStop(0, "#0b1030");
  g.addColorStop(0.55, "#1b2c7a");
  g.addColorStop(1, "#06080E");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LW, LH);
  const rg = ctx.createRadialGradient(300, 120, 10, 300, 120, 300);
  rg.addColorStop(0, "rgba(44,245,187,0.28)");
  rg.addColorStop(1, "rgba(44,245,187,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, LW, LH);
  statusBar(ctx, "#fff", "23:48");
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  font(ctx, 18, 500);
  ctx.fillText("Saturday", LW / 2, 98);
  ctx.fillStyle = "#fff";
  font(ctx, 108, 250, A, "normal", "expanded");
  ctx.letterSpacing = "-4px";
  ctx.fillText("23:48", LW / 2, 196);
  ctx.letterSpacing = "0px";
  const list = notifs.filter((n) => t >= n.at).sort((a, b) => b.at - a.at);
  let y = 244;
  for (const n of list) {
    const p = ease.out(clamp((t - n.at) / 0.28));
    notifCard(ctx, n, 16, y - (1 - p) * 40, p);
    y += 90 * p;
    if (y > LH - 130) break;
  }
  const shown = opts.hideCtl;
  if (!shown) {
    for (const x of [48, LW - 48]) {
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.arc(x, LH - 64, 24, 0, 6.3);
      ctx.fill();
    }
  }
  homeBar(ctx, "#ffffff99");
}

// ---------- the owner's view ----------
function tabBar(ctx, active) {
  ctx.fillStyle = P.panel;
  ctx.fillRect(0, LH - 84, LW, 84);
  ctx.fillStyle = P.line;
  ctx.fillRect(0, LH - 84, LW, 1);
  const tabs = ["Today", "Inbox", "Orders", "Needs you", "More"];
  tabs.forEach((l, i) => {
    const cx = 39 + i * 78;
    const on = i === active;
    ctx.fillStyle = on ? P.mint : P.smoke;
    ctx.beginPath();
    ctx.arc(cx, LH - 58, on ? 5 : 4, 0, 6.3);
    ctx.fill();
    font(ctx, 11.5, on ? 600 : 400);
    ctx.textAlign = "center";
    ctx.fillText(l, cx, LH - 36);
  });
  homeBar(ctx, "#ffffff55");
}
function ownerHeader(ctx, title, pill, pillColor) {
  ctx.fillStyle = P.ink;
  ctx.fillRect(0, 0, LW, LH);
  statusBar(ctx, "#fff", "23:52");
  ctx.textAlign = "left";
  ctx.fillStyle = P.frost;
  font(ctx, 30, 850, A, "normal", "expanded");
  ctx.letterSpacing = "-1px";
  ctx.fillText(title, 22, 96);
  ctx.letterSpacing = "0px";
  if (pill) {
    font(ctx, 12, 500, M);
    const w = ctx.measureText(pill).width + 24;
    ctx.fillStyle = pillColor;
    rr(ctx, LW - 22 - w, 72, w, 28, 14);
    ctx.fill();
    ctx.fillStyle = pillColor === P.mint ? P.ink : "#fff";
    ctx.textAlign = "center";
    ctx.fillText(pill, LW - 22 - w / 2, 90);
  }
}
/** s: { cardAt, tapAt, confirmAt, bookAt } */
export function drawOrders(ctx, t, s) {
  begin(ctx);
  const confirmed = t >= s.confirmAt;
  ownerHeader(ctx, "Orders", confirmed ? "0 pending" : t >= s.cardAt ? "1 pending" : "0 pending", confirmed || t < s.cardAt ? "#2C3752" : P.cobalt);
  // booking row
  const bp = ease.out(clamp((t - s.bookAt) / 0.4));
  if (bp > 0) {
    ctx.save();
    ctx.globalAlpha = bp;
    ctx.fillStyle = P.panel;
    rr(ctx, 16, 124 - (1 - bp) * 16, 358, 62, 16);
    ctx.fill();
    ctx.strokeStyle = bp < 1 || t < s.bookAt + 1.2 ? P.mint : P.line;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = P.frost;
    font(ctx, 16, 500);
    ctx.fillText("Table for 4 · Sun 19:00", 32, 150);
    font(ctx, 13, 400);
    ctx.fillStyle = P.smoke;
    ctx.fillText("Daniel · WhatsApp · F7-2K9M", 32, 170);
    font(ctx, 11.5, 500, M);
    ctx.fillStyle = P.mint;
    ctx.textAlign = "right";
    ctx.fillText("BOOKED", 358, 156);
    ctx.restore();
  }
  // order card
  const cp = ease.out(clamp((t - s.cardAt) / 0.55));
  if (cp > 0) {
    ctx.save();
    ctx.globalAlpha = cp;
    ctx.translate(0, (1 - cp) * -120);
    ctx.fillStyle = P.frost;
    rr(ctx, 16, 204, 358, 230, 26);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = P.ink;
    font(ctx, 12.5, 500, M);
    ctx.fillText("ORD-7KQ2 · INSTAGRAM", 34, 238);
    const pill = confirmed ? "Confirmed" : "Pending";
    font(ctx, 12.5, 500, M);
    const pw = ctx.measureText(pill).width + 22;
    ctx.fillStyle = confirmed ? P.mint : "#DDE3EE";
    rr(ctx, 356 - pw, 222, pw, 26, 13);
    ctx.fill();
    ctx.fillStyle = P.ink;
    ctx.textAlign = "center";
    ctx.fillText(pill, 356 - pw / 2, 240);
    ctx.textAlign = "left";
    font(ctx, 29, 850, A, "normal", "expanded");
    ctx.letterSpacing = "-1px";
    ctx.fillText("2 × Large", 34, 292);
    ctx.fillText("Margherita", 34, 326);
    ctx.letterSpacing = "0px";
    font(ctx, 15, 400);
    ctx.fillStyle = "#3D4A63";
    ctx.fillText("Pickup 20:00 · Daniel · RM 104", 34, 356);
    // buttons
    const bx = 34;
    const by = 376;
    ctx.fillStyle = confirmed ? "#0F2A22" : P.cobalt;
    rr(ctx, bx, by, 190, 44, 22);
    ctx.fill();
    ctx.fillStyle = confirmed ? P.mint : "#fff";
    font(ctx, 16, 600);
    ctx.textAlign = "center";
    ctx.fillText(confirmed ? "Confirmed, customer told" : "Confirm", bx + 95, by + 28);
    ctx.strokeStyle = "#B7C0D0";
    ctx.lineWidth = 1.2;
    rr(ctx, 236, by, 118, 44, 22);
    ctx.stroke();
    ctx.fillStyle = P.ink;
    font(ctx, 16, 400);
    ctx.fillText("Cancel", 295, by + 28);
    // tap ripple on Confirm
    const rp = clamp((t - s.tapAt) / 0.7);
    if (t >= s.tapAt && rp < 1) {
      ctx.strokeStyle = `rgba(44,245,187,${1 - rp})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx + 95, by + 22, 12 + rp * 70, 0, 6.3);
      ctx.stroke();
    }
    ctx.restore();
  }
  tabBar(ctx, 2);
}
/** s: { itemAt } */
export function drawNeeds(ctx, t, s) {
  begin(ctx);
  ownerHeader(ctx, "Needs you", t >= s.itemAt ? "1 open" : "0 open", t >= s.itemAt ? P.pink : "#2C3752");
  const p = ease.out(clamp((t - s.itemAt) / 0.55));
  if (p > 0) {
    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(0, (1 - p) * -90);
    ctx.fillStyle = P.panel;
    rr(ctx, 16, 128, 358, 250, 26);
    ctx.fill();
    ctx.strokeStyle = P.pink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = P.pink;
    font(ctx, 12, 500, M);
    ctx.fillText("WHATSAPP · REFUND", 36, 164);
    ctx.fillStyle = P.frost;
    font(ctx, 20, 500);
    wrapText(ctx, "Asks for a refund on last night's pickup. Says the pizza was cold.", 310).forEach((l, i) => ctx.fillText(l, 36, 200 + i * 27));
    ctx.fillStyle = P.smoke;
    font(ctx, 14, 400);
    wrapText(ctx, "Holding reply sent. Nothing was promised: only the manager approves refunds.", 310).forEach((l, i) => ctx.fillText(l, 36, 300 + i * 20));
    ctx.fillStyle = P.cobalt;
    rr(ctx, 36, 336, 150, 28, 14);
    ctx.fill();
    ctx.fillStyle = "#fff";
    font(ctx, 13, 600);
    ctx.textAlign = "center";
    ctx.fillText("Reply as owner", 111, 355);
    ctx.restore();
  }
  tabBar(ctx, 3);
}

/** A rounded card with a title and body, drawn to its own small canvas (used for the extracted "facts"). */
export function factCard(ctx, w, h, label, body, accent = P.cobalt) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(12,17,28,0.96)";
  rr(ctx, 3, 3, w - 6, h - 6, 28);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  font(ctx, 24, 500, M);
  ctx.letterSpacing = "1.5px";
  ctx.fillText(label.toUpperCase(), 36, 56);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = P.frost;
  font(ctx, 40, 500);
  wrapText(ctx, body, w - 72).forEach((l, i) => ctx.fillText(l, 36, 112 + i * 50));
}
