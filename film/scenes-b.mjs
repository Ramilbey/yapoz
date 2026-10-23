// Scenes 4 and 5: teach it once (0:25) and it answers (0:33).
import { PALETTE as P, clamp, lerp, ease, seg, keys, keys3, rng, pulse, canvasTexture, textPlane, makePhone, glow, rr, wrapText } from "./kit.mjs";
import { drawChat, factCard } from "./ui.mjs";

const TYPED = "Open Tue–Sun 12–10pm. Large Margherita RM 52. Refunds: manager only.";
const MENU = [
  ["Margherita", "28", "38", "52"],
  ["Marinara", "24", "32", "44"],
  ["Diavola", "34", "46", "62"],
  ["Quattro Formaggi", "36", "49", "66"],
  ["Funghi e Tartufo", "42", "58", "76"],
];

export function buildMiddle(world) {
  const { THREE, scene, camera, state, vo, sfx, bellState } = world;
  const g4 = new THREE.Group();
  const g5 = new THREE.Group();
  scene.add(g4, g5);
  const lookAt = new THREE.Vector3();
  const place = (o, pos, rot = [0, 0, 0], s = 1) => {
    o.position.set(...pos);
    o.rotation.set(...rot);
    o.scale.setScalar(s);
  };
  const BELL_S4 = [3.6, 0, -1.1];

  // ================= 4 · teach it once =================
  const title = textPlane({ text: "Teach it once.", size: 130, color: P.frost });
  g4.add(title.mesh);
  const titleAt = vo("s4", 0) - 0.05;
  sfx("whoosh", 25.1, 0.6);
  sfx("tick", vo("s4", 0), 1);

  // the typed note
  const note = canvasTexture(1400, 640);
  const noteMesh = new THREE.Mesh(new THREE.PlaneGeometry(1400 / 400, 640 / 400), new THREE.MeshBasicMaterial({ map: note.tex, transparent: true, toneMapped: false, depthWrite: false }));
  g4.add(noteMesh);
  const typeFrom = vo("s4", 1) + 0.15;
  const typeCps = 40;
  let lastTyped = -1;
  const drawNote = (n, showCaret) => {
    const ctx = note.ctx;
    ctx.clearRect(0, 0, 1400, 640);
    ctx.fillStyle = "rgba(12,17,28,0.96)";
    rr(ctx, 6, 6, 1388, 628, 44);
    ctx.fill();
    ctx.strokeStyle = P.cobalt;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = P.smoke;
    ctx.font = '500 40px "Martian Mono"';
    ctx.letterSpacing = "5px";
    ctx.textAlign = "left";
    ctx.fillText("DESCRIBE YOUR BUSINESS", 60, 100);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = P.frost;
    ctx.font = '500 78px "Familjen Grotesk"';
    const txt = TYPED.slice(0, n) + (showCaret ? "▏" : "");
    wrapText(ctx, txt, 1280).forEach((l, i) => ctx.fillText(l, 60, 215 + i * 104));
    note.tex.needsUpdate = true;
  };

  // the menu board "photo"
  const menu = canvasTexture(1100, 1400);
  {
    const ctx = menu.ctx;
    ctx.fillStyle = "#EAF0FB";
    rr(ctx, 0, 0, 1100, 1400, 40);
    ctx.fill();
    const gr = ctx.createLinearGradient(0, 40, 0, 1360);
    gr.addColorStop(0, "#1b2236");
    gr.addColorStop(1, "#0f1422");
    ctx.fillStyle = gr;
    rr(ctx, 30, 30, 1040, 1340, 22);
    ctx.fill();
    ctx.fillStyle = "#8DA0FF";
    ctx.font = '500 34px "Martian Mono"';
    ctx.letterSpacing = "6px";
    ctx.textAlign = "left";
    ctx.fillText("FORNO SETTE", 90, 118);
    ctx.letterSpacing = "-4px";
    ctx.fillStyle = "#F4F7FF";
    ctx.font = '850 150px "Anybody"';
    ctx.fontStretch = "expanded";
    ctx.fillText("PIZZE", 86, 280);
    ctx.fontStretch = "normal";
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "#7C88A3";
    ctx.font = '500 30px "Martian Mono"';
    ctx.textAlign = "right";
    ctx.fillText("S", 700, 372);
    ctx.fillText("M", 820, 372);
    ctx.fillText("L", 940, 372);
    MENU.forEach(([n, a, b, c], i) => {
      const y = 470 + i * 150;
      ctx.fillStyle = "#EAF0FB";
      ctx.font = '500 52px "Familjen Grotesk"';
      ctx.textAlign = "left";
      ctx.fillText(n, 90, y);
      ctx.font = '500 44px "Martian Mono"';
      ctx.textAlign = "right";
      ctx.fillText(a, 700, y);
      ctx.fillText(b, 820, y);
      ctx.fillText(c, 940, y);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(90, y + 40, 880, 2);
    });
    ctx.fillStyle = "#B3BDD2";
    ctx.font = '400 42px "Familjen Grotesk"';
    ctx.textAlign = "left";
    ctx.fillText("Open Tue to Sun · closed Mondays", 90, 1255);
    ctx.fillText("Sundays 11:00 to 22:00", 90, 1315);
    menu.tex.needsUpdate = true;
  }
  const menuMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), new THREE.MeshBasicMaterial({ map: menu.tex, transparent: true, toneMapped: false, depthWrite: false }));
  menuMesh.material.color.setScalar(0.9);
  g4.add(menuMesh);
  const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.05), new THREE.MeshBasicMaterial({ color: P.mint, transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  g4.add(scanLine);
  const scanGlow = glow(P.mint, 2.6, 0.5);
  g4.add(scanGlow);
  const snapAt = vo("s4", 6) - 0.04;
  sfx("click", snapAt, 1);
  sfx("scan", vo("s4", 9) - 0.05, 0.8);

  // the facts it extracts
  const FACTS = [
    { label: "Prices", body: "Margherita S 28 · M 38 · L 52", row: 0, at: vo("s4", 12) - 0.2, color: P.cobalt },
    { label: "Delivery", body: "Bangsar RM 5, minimum RM 40", row: 1, at: vo("s4", 12) + 0.25, color: P.cobalt },
    { label: "Hours", body: "Tue–Sun, closed Mondays", row: 3, at: vo("s4", 13) - 0.1, color: P.ice },
    { label: "Sundays", body: "11:00–22:00, last orders 21:30", row: 4, at: vo("s4", 14) - 0.15, color: P.ice },
    { label: "House rule", body: "Refunds: manager only", row: 2, at: vo("s4", 15) - 0.1, color: P.mint },
  ].map((f) => {
    const cv = canvasTexture(680, 250);
    factCard(cv.ctx, 680, 250, f.label, f.body, f.color);
    cv.tex.needsUpdate = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.625), new THREE.MeshBasicMaterial({ map: cv.tex, transparent: true, toneMapped: false, depthWrite: false }));
    g4.add(mesh);
    sfx("pop", f.at + 0.5, 0.7);
    return { ...f, mesh };
  });
  // "you check each one"
  const CHECKS = ["Prices", "Hours", "Rules"].map((label, i) => {
    const cv = canvasTexture(760, 150);
    const ctx = cv.ctx;
    ctx.fillStyle = "rgba(12,17,28,0.96)";
    rr(ctx, 4, 4, 752, 142, 40);
    ctx.fill();
    ctx.strokeStyle = P.line;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = P.mint;
    ctx.beginPath();
    ctx.arc(76, 75, 38, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(58, 76);
    ctx.lineTo(72, 91);
    ctx.lineTo(97, 60);
    ctx.stroke();
    ctx.fillStyle = P.frost;
    ctx.font = '500 56px "Familjen Grotesk"';
    ctx.textAlign = "left";
    ctx.fillText(`${label} checked by you`, 142, 95);
    cv.tex.needsUpdate = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.434), new THREE.MeshBasicMaterial({ map: cv.tex, transparent: true, toneMapped: false, depthWrite: false }));
    g4.add(mesh);
    const at = [vo("s4", 18), vo("s4", 19) + 0.02, vo("s4", 20) + 0.04][i];
    sfx("ding", at, 0.28);
    return { mesh, at };
  });
  // the running count above the bell
  const tally = canvasTexture(900, 300);
  const tallyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.8), new THREE.MeshBasicMaterial({ map: tally.tex, transparent: true, toneMapped: false, depthWrite: false }));
  g4.add(tallyMesh);
  let lastTally = -1;
  const drawTally = (n) => {
    const ctx = tally.ctx;
    ctx.clearRect(0, 0, 900, 300);
    ctx.textAlign = "center";
    ctx.fillStyle = P.smoke;
    ctx.font = '500 40px "Martian Mono"';
    ctx.letterSpacing = "5px";
    ctx.fillText("FACTS LEARNED", 450, 80);
    ctx.letterSpacing = "-2px";
    ctx.fillStyle = P.mint;
    ctx.font = '850 150px "Anybody"';
    ctx.fontStretch = "expanded";
    ctx.fillText(String(n).padStart(2, "0"), 450, 230);
    ctx.fontStretch = "normal";
    ctx.letterSpacing = "0px";
    tally.tex.needsUpdate = true;
  };

  // ================= 5 · it answers =================
  const wa = makePhone();
  const tg = makePhone();
  const ig = makePhone();
  wa.halo.material.color.set("#25D366");
  tg.halo.material.color.set("#2AABEE");
  ig.halo.material.color.set("#D62976");
  g5.add(wa.group, tg.group, ig.group);
  const SC = {
    whatsapp: [
      { who: "me", text: "hi, are you open Sunday?", at: vo("s5", 4) + 0.1, time: "23:46" },
      { who: "biz", text: "Hi! Yes: on Sundays we're open 11:00 to 22:00, and the kitchen takes last orders at 21:30. Would you like a table, or an order for pickup?", at: 35.7, typeFrom: 34.5, time: "23:46" },
      { who: "me", text: "table for 4, 7pm", at: 37.0, time: "23:47" },
      { who: "biz", text: "Sunday 19:00 for 4 is free. What name should I put it under?", at: 38.5, typeFrom: 37.5, time: "23:47" },
      { who: "me", text: "Daniel", at: 39.7, time: "23:47" },
      { who: "biz", text: "Booked: Daniel, 4 people, Sunday 19:00. Your reference is F7-2K9M. See you then!", at: 41.0, typeFrom: 40.1, time: "23:47" },
    ],
    telegram: [
      { who: "me", text: "how much is a large Margherita?", at: vo("s5", 5) + 0.1, time: "23:41" },
      { who: "biz", text: 'A large Margherita (15") is RM 52. Shall I start an order?', at: 36.4, typeFrom: 35.3, time: "23:41" },
      { who: "me", text: "yes, plus a large Diavola", at: 38.1, time: "23:42" },
      { who: "biz", text: "1 × Large Margherita RM 52 and 1 × Large Diavola RM 62: RM 114. Pickup or delivery?", at: 39.7, typeFrom: 38.6, time: "23:42" },
      { who: "me", text: "pickup at 8pm", at: 40.9, time: "23:42" },
      { who: "biz", text: "Noted: pickup 20:00. I'm sending it to the team to confirm.", at: 42.1, typeFrom: 41.3, time: "23:42" },
    ],
    instagram: [
      { who: "me", text: "the apron in red size M ada?", at: vo("s5", 7) + 0.1, time: "23:38" },
      { who: "biz", text: "Yes! The Forno Sette canvas apron in Brick Red, size M: 6 in stock, RM 69.", at: 37.3, typeFrom: 36.2, time: "23:38" },
      { who: "me", text: "add it to my order pls", at: 39.0, time: "23:39" },
      { who: "biz", text: "Done. It will arrive with your pizza.", at: 40.5, typeFrom: 39.5, time: "23:39" },
    ],
  };
  for (const k of Object.keys(SC)) for (const m of SC[k]) sfx(m.who === "biz" ? "pop" : "tick", m.at, m.who === "biz" ? 0.8 : 0.9);
  // chips under each reply: where the answer came from
  const chipTex = (text) => {
    const cv = canvasTexture(900, 130);
    const ctx = cv.ctx;
    ctx.fillStyle = "rgba(6,8,14,0.92)";
    rr(ctx, 4, 4, 892, 122, 61);
    ctx.fill();
    ctx.strokeStyle = P.mint;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = P.mint;
    ctx.beginPath();
    ctx.arc(64, 65, 12, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = P.frost;
    ctx.font = '500 42px "Martian Mono"';
    ctx.textAlign = "left";
    ctx.fillText(text, 96, 80);
    cv.tex.needsUpdate = true;
    return cv.tex;
  };
  const CHIPS = [
    { phone: wa, x: 0, text: "from your opening hours", at: 35.8 },
    { phone: tg, x: -2.35, text: "from your price list", at: 36.5 },
    { phone: ig, x: 2.35, text: "stock checked: 6 left", at: 37.4 },
    { phone: wa, x: 0, text: "free slot checked", at: 38.6 },
    { phone: tg, x: -2.35, text: "total worked out", at: 39.8 },
    { phone: ig, x: 2.35, text: "added to the same order", at: 40.6 },
    { phone: wa, x: 0, text: "booking saved", at: 41.1 },
  ].map((c) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.26), new THREE.MeshBasicMaterial({ map: chipTex(c.text), transparent: true, toneMapped: false, depthWrite: false }));
    g5.add(mesh);
    return { ...c, mesh };
  });
  const inSeconds = textPlane({ text: "in seconds.", font: "Anybody", style: "italic", weight: 800, stretch: "extra-condensed", size: 300, color: P.mint, tracking: -0.01 });
  const onlyFacts = textPlane({ text: "only your facts.", font: "Anybody", style: "italic", weight: 800, stretch: "extra-condensed", size: 300, color: P.frost, tracking: -0.01 });
  g5.add(inSeconds.mesh, onlyFacts.mesh);
  const secAt = vo("s5", 8) - 0.05;
  const factsAt = vo("s5", 21) - 0.05;
  sfx("whoosh", 33.0, 0.7);
  sfx("tick", secAt, 1);
  sfx("tick", factsAt, 1);
  // pulses travelling from the bell to the phones
  const pulses = [];
  const pulseTimes = [];
  for (const [phone, x] of [[wa, 0], [tg, -2.35], [ig, 2.35]]) for (const m of SC[phone === wa ? "whatsapp" : phone === tg ? "telegram" : "instagram"]) if (m.who === "biz") pulseTimes.push({ x, at: m.typeFrom + 0.1 });
  for (const pt of pulseTimes) {
    const m = glow(P.mint, 0.55, 0.9);
    g5.add(m);
    pulses.push({ ...pt, mesh: m });
  }

  return {
    update(t) {
      g4.visible = t >= 25.0 && t < 33.4;
      g5.visible = t >= 32.6 && t < 43.2;

      // ---------- 4 ----------
      if (g4.visible) {
        const open = seg(t, 25.1, 26.1, ease.inOut);
        bellState.visible = true;
        bellState.pos = [lerp(0, BELL_S4[0], open), 0, lerp(1.5, BELL_S4[2], open)];
        bellState.scale = lerp(0.92, 0.66, open);
        bellState.rise = 1;
        bellState.spin = open * 0.5;
        let ring = 0;
        const arrivals = FACTS.map((f) => f.at + 0.85);
        for (const a of arrivals) ring = Math.max(ring, pulse(t, a, 0.5) * 0.8);
        bellState.ring = ring;
        bellState.tilt = arrivals.reduce((s, a) => s + (t > a ? Math.exp(-(t - a) * 8) * Math.sin((t - a) * 40) * 0.025 : 0), 0);
        // camera: hand over from the orbit at the end of scene 3
        camera.position.set(...keys3(t, [[25.0, [2.7, 2.5, 8.2]], [26.2, [0.9, 1.75, 7.8]], [33.4, [0.6, 1.7, 7.0]]], ease.inOut));
        lookAt.set(...keys3(t, [[25.0, [0, 0.85, 0]], [26.2, [0.9, 1.35, 0]], [33.4, [0.8, 1.35, 0]]]));
        camera.lookAt(lookAt);

        const te = seg(t, titleAt, titleAt + 0.7, ease.outExpo);
        title.mesh.visible = te > 0;
        place(title.mesh, [-1.15, 2.95 + (1 - te) * 0.3, 0.2], [0, 0.1, 0], 1);
        title.mat.opacity = te * (1 - seg(t, 31.0, 31.6));

        // typed note, then it steps aside when the menu arrives
        const ne = seg(t, typeFrom - 0.45, typeFrom + 0.15, ease.outQuint);
        const away = seg(t, snapAt, snapAt + 0.7, ease.inOut);
        noteMesh.visible = ne > 0 && t < 31;
        place(noteMesh, [lerp(-1.0, -2.75, away), lerp(1.45, 0.25, away), lerp(0.5, -0.6, away)], [0, lerp(0.12, 0.5, away), 0], lerp(0.95, 0.45, away));
        noteMesh.material.opacity = ne * lerp(1, 0.55, away);
        const n = clamp(Math.floor((t - typeFrom) * typeCps), 0, TYPED.length);
        const caret = Math.floor(t * 2.4) % 2 === 0 && n < TYPED.length;
        const key = n * 2 + (caret ? 1 : 0);
        if (key !== lastTyped) {
          lastTyped = key;
          drawNote(n, caret);
        }
        if (t > typeFrom && t < typeFrom + TYPED.length / typeCps) {
          if (Math.floor(t * 60) % 3 === 0) state.shake = Math.max(state.shake, 0.0006);
        }

        // the menu photo: a camera flash, then it hangs in the air
        const me = seg(t, snapAt, snapAt + 0.6, ease.outExpo);
        const shift = seg(t, 30.4, 31.2, ease.inOut);
        menuMesh.visible = t >= snapAt;
        place(menuMesh, [lerp(1.0, -1.75, shift), 1.55 + (1 - me) * 0.3, lerp(1.6, 0.4, me) + (1 - me) * 1.5], [0.04 * (1 - me), lerp(0.28, 0.34, shift) - (1 - me) * 0.6, (1 - me) * 0.15], lerp(1.1, 0.8, shift) * lerp(1.25, 1, me));
        menuMesh.material.opacity = me * (1 - seg(t, 32.5, 33.1));
        state.flash += pulse(t, snapAt, 0.18) * 0.28;
        // scan line
        const sp = seg(t, vo("s4", 9) - 0.05, vo("s4", 9) + 2.2, ease.inOut);
        scanLine.visible = sp > 0 && sp < 1;
        scanGlow.visible = scanLine.visible;
        const mp = menuMesh.position;
        const half = 1.4 * menuMesh.scale.x;
        scanLine.position.set(mp.x, mp.y + half - sp * 2 * half, mp.z + 0.02);
        scanLine.rotation.y = menuMesh.rotation.y;
        scanLine.scale.setScalar(menuMesh.scale.x);
        scanGlow.position.copy(scanLine.position);
        scanGlow.position.z += 0.05;
        // facts fly from the menu lines to the bell
        const bellTop = new THREE.Vector3(bellState.pos[0], 1.2, bellState.pos[2] + 0.2);
        let learned = 0;
        for (const f of FACTS) {
          const p = (t - f.at) / 1.0;
          f.mesh.visible = p > 0 && p < 1.05;
          if (p >= 1) learned++;
          if (!f.mesh.visible) continue;
          const e = ease.inOut(clamp(p));
          const rowY = mp.y + 1.1 * menuMesh.scale.x - (f.row * 0.3 + 0.2) * menuMesh.scale.x * 1.15;
          const from = new THREE.Vector3(mp.x + 0.2, rowY, mp.z + 0.15);
          const mid = new THREE.Vector3((from.x + bellTop.x) / 2, Math.max(from.y, bellTop.y) + 1.1, mp.z + 1.2);
          const a = from.clone().lerp(mid, e);
          const b = mid.clone().lerp(bellTop, e);
          const pos = a.lerp(b, e);
          place(f.mesh, [pos.x, pos.y, pos.z], [0, lerp(0.2, -0.4, e), lerp(0, -0.25, e)], lerp(1.15, 0.28, ease.in(clamp(p))));
          f.mesh.material.opacity = Math.min(1, p * 6) * (1 - seg(p, 0.85, 1.02));
        }
        const learnedNow = Math.min(12, FACTS.reduce((s, f) => s + (t > f.at + 0.85 ? 2 + (f.row % 2) : 0), 0));
        const tl = t > FACTS[0].at ? learnedNow : 0;
        tallyMesh.visible = t > FACTS[0].at - 0.2 && t < 32.9;
        place(tallyMesh, [BELL_S4[0] + 0.1, 2.35, BELL_S4[2]], [0, -0.2, 0], 1);
        tallyMesh.material.opacity = seg(t, FACTS[0].at - 0.2, FACTS[0].at + 0.3) * (1 - seg(t, 32.4, 32.9));
        if (tl !== lastTally) {
          lastTally = tl;
          drawTally(tl);
        }
        void learned;
        // review ticks
        CHECKS.forEach((c, i) => {
          const e = seg(t, c.at - 0.05, c.at + 0.5, ease.outExpo);
          c.mesh.visible = e > 0;
          place(c.mesh, [0.9 - (1 - e) * 0.8, 2.05 - i * 0.52, 0.9], [0, -0.18, 0], lerp(0.8, 1, e));
          c.mesh.material.opacity = e * (1 - seg(t, 32.5, 33.1));
        });
        state.fade = Math.max(state.fade, 0);
        state.alert = 0;
        if (t > 32.7) state.glitch = Math.max(state.glitch, seg(t, 32.7, 32.95, ease.lin) * (1 - seg(t, 32.95, 33.2, ease.lin)) * 0.9);
      }

      // ---------- 5 ----------
      if (g5.visible) {
        const POS = { wa: [0, 1.5, 0.3], tg: [-2.45, 1.35, -0.9], ig: [2.45, 1.35, -0.9] };
        const enter = (a) => seg(t, a, a + 0.9, ease.outQuint);
        const leave = seg(t, 42.3, 43.0, ease.in);
        camera.position.set(...keys3(t, [[32.8, [0.0, 1.8, 5.4]], [35.0, [-0.3, 2.0, 7.2]], [39, [0.3, 2.05, 7.3]], [42.8, [0.0, 2.05, 6.9]]], ease.inOut));
        lookAt.set(...keys3(t, [[32.8, [0, 1.5, 0]], [35, [0, 2.0, 0]], [42.8, [0, 2.0, 0]]]));
        camera.lookAt(lookAt);
        const e1 = enter(32.9);
        const e2 = enter(33.5);
        const e3 = enter(34.0);
        place(wa.group, [POS.wa[0], lerp(-1.4, POS.wa[1], e1) - leave * 2.8, POS.wa[2]], [-0.02, keys(t, [[32.9, 0.25], [38, -0.05], [43, 0.08]]), 0], 1.32);
        place(tg.group, [lerp(-4.2, POS.tg[0], e2), lerp(-1.4, POS.tg[1], e2) - leave * 3.0, POS.tg[2]], [-0.02, lerp(0.9, 0.5, e2), 0.02], 1);
        place(ig.group, [lerp(4.2, POS.ig[0], e3), lerp(-1.4, POS.ig[1], e3) - leave * 3.2, POS.ig[2]], [-0.02, lerp(-0.9, -0.5, e3), -0.02], 1);
        for (const ph of [wa, tg, ig]) ph.halo.material.opacity = 0.16;
        wa.group.visible = t >= 32.9;
        tg.group.visible = t >= 33.5;
        ig.group.visible = t >= 34.0;
        drawChat(wa.screen.ctx, "whatsapp", t, SC.whatsapp);
        wa.screen.tex.needsUpdate = true;
        drawChat(tg.screen.ctx, "telegram", t, SC.telegram);
        tg.screen.tex.needsUpdate = true;
        drawChat(ig.screen.ctx, "instagram", t, SC.instagram, { seenAt: 39.4 });
        ig.screen.tex.needsUpdate = true;

        // the bell hovers above the three phones; its pulses run down to each reply
        bellState.visible = true;
        bellState.floating = true;
        const bob = Math.sin(t * 1.6) * 0.06;
        bellState.pos = [0, 3.75 + bob + (1 - seg(t, 32.9, 33.7, ease.outQuint)) * 1.5 + leave * 1.5, -0.8];
        bellState.scale = 0.3;
        bellState.rise = 1;
        bellState.spin = 0.5 + t * 0.25;
        bellState.ring = Math.max(...pulseTimes.map((p) => pulse(t, p.at + 0.45, 0.5) * 0.8));
        for (const p of pulses) {
          const q = (t - p.at) / 0.7;
          p.mesh.visible = q > 0 && q < 1;
          if (!p.mesh.visible) continue;
          const e = ease.inOut(q);
          const a = new THREE.Vector3(0, 3.7, -0.8);
          const c = new THREE.Vector3(p.x * 0.7, 2.8, 0.2);
          const d = new THREE.Vector3(p.x, p.x === 0 ? 2.9 : 2.6, p.x === 0 ? 0.4 : -0.8);
          const pos = a.lerp(c, e).lerp(c.clone().lerp(d, e), e);
          p.mesh.position.copy(pos);
          p.mesh.lookAt(camera.position);
          p.mesh.material.opacity = Math.sin(q * Math.PI) * 0.95;
        }
        for (const c of CHIPS) {
          const e = seg(t, c.at, c.at + 0.5, ease.outExpo) * (1 - seg(t, c.at + 2.0, c.at + 2.5));
          c.mesh.visible = e > 0.01;
          const cy = c.x === 0 ? 3.12 : 2.5;
          place(c.mesh, [c.x, cy - (1 - e) * 0.25, c.x === 0 ? 0.6 : -0.4], [0, c.x === 0 ? 0 : c.x > 0 ? -0.4 : 0.4, 0], lerp(0.85, 1, e));
          c.mesh.material.opacity = e;
        }
        const ie = seg(t, secAt, secAt + 0.6, ease.outExpo) * (1 - seg(t, secAt + 2.4, secAt + 3.0));
        inSeconds.mesh.visible = ie > 0.01;
        place(inSeconds.mesh, [-1.9, 3.4 - (1 - ie) * 0.3, -0.2], [0, 0.1, 0], 0.8);
        inSeconds.mat.opacity = ie;
        const fe = seg(t, factsAt, factsAt + 0.6, ease.outExpo) * (1 - seg(t, 42.3, 42.8));
        onlyFacts.mesh.visible = fe > 0.01;
        place(onlyFacts.mesh, [-1.75, 3.4 - (1 - fe) * 0.3, -0.2], [0, 0.1, 0], 0.8);
        onlyFacts.mat.opacity = fe;
        if (t > 42.6) state.glitch = Math.max(state.glitch, seg(t, 42.6, 42.85, ease.lin) * (1 - seg(t, 42.85, 43.1, ease.lin)) * 0.9);
      }
    },
  };
}
