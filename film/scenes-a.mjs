// Scenes 1 to 3: 11:48 pm (0:00), the cost of waiting (0:08), meet Yapoz (0:17).
import { PALETTE as P, clamp, lerp, ease, seg, keys, keys3, rng, wobble, pulse, canvasTexture, textPlane, makePhone, glow, streak, rr, wrapText } from "./kit.mjs";
import { drawLock, notifCard, drawChat } from "./ui.mjs";

const NOTIFS = [
  { at: 1.0, app: "whatsapp", name: "Aisyah", text: "are you open on Sunday?" },
  { at: 1.75, app: "instagram", name: "daniel.k", text: "two large margherita, pickup 8?" },
  { at: 2.35, app: "telegram", name: "Mei Ling", text: "any slot Saturday at 11?" },
  { at: 2.85, app: "whatsapp", name: "Hakim", text: "how much for keratin" },
  { at: 3.25, app: "instagram", name: "melissa.eats", text: "do you deliver to Bangsar?" },
  { at: 3.6, app: "telegram", name: "Kavitha S.", text: "still got the red one in M?" },
  { at: 3.9, app: "whatsapp", name: "+60 12-4•• ••81", text: "large margherita how much" },
  { at: 4.15, app: "whatsapp", name: "Sharon Lee", text: "table for 6 saturday?" },
  { at: 4.38, app: "instagram", name: "jun.wei", text: "halal ke?" },
  { at: 4.58, app: "telegram", name: "Ganesh", text: "can I cancel my booking" },
  { at: 4.76, app: "whatsapp", name: "Nur Amira", text: "open on public holiday?" },
  { at: 4.92, app: "instagram", name: "chloe.ng", text: "parking got?" },
  { at: 5.06, app: "whatsapp", name: "Arjun", text: "price for a large pizza?" },
  { at: 5.18, app: "telegram", name: "Farah", text: "can change my booking?" },
  { at: 5.3, app: "whatsapp", name: "Tom", text: "u there?" },
  { at: 5.4, app: "instagram", name: "yusuf.a", text: "hello??" },
];

export function buildOpening(world) {
  const { THREE, scene, camera, state, vo, voEnd, sfx, bellState } = world;
  const g1 = new THREE.Group();
  const g2 = new THREE.Group();
  const g3 = new THREE.Group();
  scene.add(g1, g2, g3);
  const bellClipPlane = world.bell.dome.clippingPlanes?.[0];

  // ================= 1 · 11:48 pm =================
  const lock = makePhone();
  lock.group.position.set(1.2, 1.35, 0);
  g1.add(lock.group);
  const lockHalo = lock.halo;
  lockHalo.material.opacity = 0.3;
  NOTIFS.forEach((n) => sfx("ping", n.at + 0.05, 0.7));
  sfx("whoosh", 0.3, 0.6);

  // the unread counter, big, on the left
  const counter = canvasTexture(1400, 700);
  const counterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1400 / 480, 700 / 480), new THREE.MeshBasicMaterial({ map: counter.tex, transparent: true, toneMapped: false, depthWrite: false }));
  counterMesh.position.set(-0.7, 1.7, 0.3);
  g1.add(counterMesh);
  let lastCount = -1;
  const drawCounter = (n, hot) => {
    const ctx = counter.ctx;
    ctx.clearRect(0, 0, 1400, 700);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = P.smoke;
    ctx.font = '500 40px "Martian Mono"';
    ctx.letterSpacing = "6px";
    ctx.fillText("UNREAD MESSAGES", 40, 120);
    ctx.letterSpacing = "-14px";
    ctx.fillStyle = hot ? P.mint : P.frost;
    ctx.font = '300 400px "Anybody"';
    ctx.fontStretch = "expanded";
    ctx.fillText(String(n).padStart(3, "0"), 30, 480);
    ctx.fontStretch = "normal";
    ctx.letterSpacing = "0px";
    ctx.font = '400 40px "Familjen Grotesk"';
    ctx.fillStyle = P.fog;
    ctx.fillText("WhatsApp · Telegram · Instagram", 40, 570);
    counter.tex.needsUpdate = true;
  };

  // floating copies of the notifications, thrown out of the phone toward the camera
  const r1 = rng(11);
  const floaters = NOTIFS.slice(3).map((n, i) => {
    const cv = canvasTexture(716, 160);
    cv.ctx.setTransform(2, 0, 0, 2, 0, 0);
    notifCard(cv.ctx, n, 0, 0, 1);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.877, 0.196), new THREE.MeshBasicMaterial({ map: cv.tex, transparent: true, toneMapped: false, depthWrite: false }));
    g1.add(mesh);
    const ang = r1() * 6.28;
    return { mesh, at: n.at + 0.1, dir: new THREE.Vector3(Math.cos(ang) * (1.5 + r1() * 2.2) - 0.8, Math.sin(ang) * (0.9 + r1() * 1.3) + 0.2, 2.2 + r1() * 2.4), spin: (r1() - 0.5) * 0.7 };
  });

  // ================= 2 · the cost of waiting =================
  const QUESTIONS = [
    { text: "How much?", i: 0, pos: [-1.3, 2.0, 0.4], size: 250, kind: "fill" },
    { text: "Are you open?", i: 2, pos: [1.2, 1.2, -1.8], size: 250, kind: "stroke" },
    { text: "Is it in stock?", i: 5, pos: [-0.9, 0.45, -3.6], size: 250, kind: "accent" },
  ].map((q) => {
    const plane =
      q.kind === "fill"
        ? textPlane({ text: q.text, size: q.size, color: P.frost })
        : q.kind === "stroke"
          ? textPlane({ text: q.text, size: q.size, stroke: P.ice, strokeW: 6 })
          : textPlane({ text: q.text, size: q.size * 1.18, font: "Anybody", style: "italic", weight: 800, stretch: "extra-condensed", color: P.mint, tracking: -0.01 });
    plane.mesh.position.set(...q.pos);
    g2.add(plane.mesh);
    sfx("thud", vo("s2", q.i) - 0.02, 0.9);
    return { ...q, plane, at: vo("s2", q.i) - 0.05 };
  });
  const elseTxt = textPlane({ text: "someone else.", font: "Anybody", style: "italic", weight: 800, stretch: "extra-condensed", size: 330, color: P.pink, tracking: -0.01 });
  elseTxt.mesh.position.set(1.0, 2.4, 0.8);
  g2.add(elseTxt.mesh);
  const elseAt = vo("s2", 17) - 0.05;
  sfx("alert", elseAt, 0.9);
  const backTxt = textPlane({ text: "and they rarely come back.", font: "Anybody", style: "italic", weight: 700, stretch: "extra-condensed", size: 170, color: P.frost, tracking: -0.01 });
  backTxt.mesh.position.set(1.0, 1.55, 0.8);
  g2.add(backTxt.mesh);
  const backAt = vo("s2", 19) - 0.05;

  const chatA = makePhone();
  g2.add(chatA.group);
  const scriptA = [
    { who: "me", text: "hi, are you open Sunday?", at: 11.55, time: "23:49" },
    { who: "me", text: "hello?", at: 12.1, time: "23:53" },
    { who: "me", text: "how much for a large margherita?", at: 12.55, time: "00:04" },
    { who: "me", text: "ok never mind, I'll order from somewhere else", at: elseAt - 0.1, time: "00:09" },
  ];
  scriptA.forEach((m) => sfx("pop", m.at, 0.7));
  const S2_END = 16.2;

  // ================= 3 · meet Yapoz =================
  const T3 = vo("s3", 1) - 0.04;
  sfx("ding", T3, 1);
  sfx("whoosh", 16.15, 0.8);
  sfx("thud", T3 - 0.02, 0.6);
  const letters = "Yapoz".split("").map((ch) => {
    const p = textPlane({ text: ch, size: 640, gradient: ["#F4F7FF", "#6F86FF"], tracking: -0.04, pad: 8 });
    p.mat.clippingPlanes = bellClipPlane ? [bellClipPlane] : null;
    g3.add(p.mesh);
    return p;
  });
  const total = letters.reduce((s, l) => s + l.w * 0.8, 0);
  let cx = -total / 2;
  letters.forEach((l) => {
    l.x = cx + (l.w * 0.8) / 2;
    cx += l.w * 0.8;
  });
  const tagline = textPlane({ text: "THE FRONT DESK THAT NEVER CLOSES", font: "Martian Mono", weight: 500, stretch: "normal", size: 70, color: P.frost, tracking: 0.12 });
  tagline.mesh.rotation.x = -Math.PI / 2;
  tagline.mesh.position.set(0, 0.012, 4.3);
  g3.add(tagline.mesh);
  const flare = streak(P.ice, 14, 0.5, 0.0);
  flare.position.set(0, 1.0, 2.0);
  g3.add(flare);
  const ringA = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 128), new THREE.MeshBasicMaterial({ color: P.mint, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  const ringB = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 128), new THREE.MeshBasicMaterial({ color: P.cobalt, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  for (const rg of [ringA, ringB]) {
    rg.rotation.x = -Math.PI / 2;
    rg.position.set(0, 0.02, 1.5);
    g3.add(rg);
  }
  // sparks
  const SPARKS = 140;
  const r3 = rng(5);
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(SPARKS * 3);
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparkVel = Array.from({ length: SPARKS }, () => {
    const a = r3() * 6.283;
    const up = 0.3 + r3() * 1.2;
    const sp = 1.2 + r3() * 3.4;
    return [Math.cos(a) * sp, up * 2.4, Math.sin(a) * sp * 0.7];
  });
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ map: world.bokehGroup.children[0].material.map, color: P.mint, size: 0.16, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, sizeAttenuation: true }));
  sparks.frustumCulled = false;
  g3.add(sparks);
  // pills that fall onto the bell, then orbit it
  const pillText = [
    ["haircut tmr 3pm?", "Booked: Thu 3pm"],
    ["large margherita how much", "RM 52, ready in 15 min"],
    ["got size M in red?", "Red M: 6 in stock"],
    ["open on monday?", "Closed Mondays, sorry"],
    ["deliver to bangsar?", "Yes: RM 5, about 40 min"],
    ["table for 4 fri 8pm?", "Booked: Fri 8pm"],
    ["u guys halal ah?", "Halal-certified kitchen"],
    ["can I change my booking?", "Moved to Sun 3pm"],
  ];
  const pillTex = (text, bg, fg) => {
    const cv = canvasTexture(1024, 256);
    const ctx = cv.ctx;
    ctx.fillStyle = bg;
    rr(ctx, 4, 4, 1016, 248, 124);
    ctx.fill();
    ctx.fillStyle = fg;
    let size = 82;
    ctx.font = `600 ${size}px "Familjen Grotesk"`;
    while (ctx.measureText(text).width > 880 && size > 40) {
      size -= 4;
      ctx.font = `600 ${size}px "Familjen Grotesk"`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 512, 132);
    cv.tex.needsUpdate = true;
    return cv.tex;
  };
  const makePill = (text, mint) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: pillTex(text, mint ? P.mint : "#EAF0FB", P.ink), transparent: true, toneMapped: false, depthWrite: false }));
    m.material.color.setScalar(0.8);
    g3.add(m);
    return m;
  };
  const strikePill = makePill(pillText[0][0], false);
  const strikeAnswer = makePill(pillText[0][1], true);
  const orbiters = pillText.slice(1).map(([q, a], i) => ({ mesh: makePill(i % 2 ? a : q, i % 2 === 1), i }));
  const ORBIT_AT = vo("s3", 8);

  // phrases that arrive on the beat of the voice, either side of the bell
  const PHRASES = [
    { text: "One assistant.", i: 8, pos: [-3.5, 2.55, -0.6], mk: () => textPlane({ text: "One assistant.", size: 190, color: P.frost }) },
    { text: "Every chat.", i: 11, pos: [3.2, 1.95, -0.5], mk: () => textPlane({ text: "Every chat.", size: 190, stroke: P.ice, strokeW: 5 }) },
    { text: "Your business.", i: 13, pos: [-3.4, 1.2, 0.8], mk: () => textPlane({ text: "Your business.", font: "Anybody", style: "italic", weight: 800, stretch: "extra-condensed", size: 240, color: P.mint, tracking: -0.01 }) },
    { text: "Only yours.", i: 18, pos: [3.1, 2.95, -0.9], mk: () => textPlane({ text: "Only yours.", font: "Anybody", style: "italic", weight: 800, stretch: "extra-condensed", size: 240, color: P.pink, tracking: -0.01 }) },
  ].map((p) => {
    const plane = p.mk();
    g3.add(plane.mesh);
    sfx("tick", vo("s3", p.i) - 0.02, 1);
    return { ...p, plane, at: vo("s3", p.i) - 0.04 };
  });

  const lookAt = new THREE.Vector3();
  const place = (o, pos, rot = [0, 0, 0], s = 1) => {
    o.position.set(...pos);
    o.rotation.set(...rot);
    o.scale.setScalar(s);
  };

  return {
    update(t) {
      g1.visible = t < 8.7;
      g2.visible = t >= 7.9 && t < 16.4;
      g3.visible = t >= 16.1 && t < 25.3;

      // ---------- 1 ----------
      if (g1.visible) {
        const enter = seg(t, 0.0, 1.5, ease.outQuint);
        const leave = seg(t, 7.6, 8.5, ease.in);
        const buzz = NOTIFS.reduce((s, n) => s + (t > n.at && t < n.at + 0.4 ? wobble(t - n.at, 52, 12) : 0), 0);
        const baseRotY = keys(t, [[0, -0.62], [8, -0.3]]);
        place(lock.group, [1.2 + leave * 6 + buzz * 0.012, lerp(0.1, 1.35, enter) - leave * 1.4, leave * 1.5], [-0.04 + enter * 0.01, baseRotY + leave * 1.4, 0.07 - 0.05 * enter + buzz * 0.03 + leave * 0.4], lerp(0.88, 1, enter));
        lockHalo.material.opacity = 0.3 * enter + 0.12 * Math.sin(t * 3) ** 2;
        drawLock(lock.screen.ctx, t, NOTIFS);
        lock.screen.tex.needsUpdate = true;
        const count = Math.round(148 * ease.in(clamp((t - 0.9) / 6.4)));
        if (count !== lastCount) {
          lastCount = count;
          drawCounter(count, t > 5.2);
        }
        counterMesh.material.opacity = seg(t, 0.6, 1.4) * (1 - seg(t, 7.8, 8.4));
        counterMesh.position.x = -0.7 - leave * 3;
        for (const f of floaters) {
          const p = (t - f.at) / 2.4;
          f.mesh.visible = p > 0 && p < 1;
          if (!f.mesh.visible) continue;
          const e = ease.out(clamp(p));
          place(f.mesh, [1.2 + f.dir.x * e, 1.7 + f.dir.y * e, f.dir.z * e], [0, (f.dir.x > 0 ? -0.3 : 0.3) * e, f.spin * e], 0.5 + e * 0.7);
          f.mesh.material.opacity = Math.min(1, p * 8) * (1 - seg(p, 0.55, 1, ease.in)) * 0.9;
        }
        const camT = t;
        camera.position.set(...keys3(camT, [[0, [0.2, 1.8, 7.2]], [8, [0.8, 1.5, 5.1]]], ease.inOut));
        lookAt.set(...keys3(camT, [[0, [0.2, 1.45, 0]], [8, [0.9, 1.3, 0]]]));
        camera.lookAt(lookAt);
        state.shake = Math.max(state.shake, NOTIFS.reduce((s, n) => Math.max(s, t > n.at && t < n.at + 0.3 ? 0.004 * Math.exp(-(t - n.at) * 10) : 0), 0));
        state.fade = Math.max(state.fade, 1 - seg(t, 0, 0.7));
        const g = seg(t, 7.75, 8.1, ease.lin) * (1 - seg(t, 8.1, 8.4, ease.lin));
        state.glitch = Math.max(state.glitch, g);
        state.ca = Math.max(state.ca, 0.0016 + g * 0.012);
      }

      // ---------- 2 ----------
      if (g2.visible) {
        camera.position.set(...keys3(t, [[8.0, [0.0, 1.5, 9.4]], [10.9, [0.25, 1.4, 5.0]], [11.9, [0.0, 1.5, 5.4]], [S2_END, [-0.1, 1.5, 4.9]]], ease.inOut));
        lookAt.set(...keys3(t, [[8, [0, 1.3, 0]], [10.9, [0, 1.1, -2]], [11.9, [0, 1.3, 0]], [S2_END, [0.5, 1.35, 0]]]));
        camera.lookAt(lookAt);
        const fadeWords = 1 - seg(t, 10.9, 11.7);
        for (const q of QUESTIONS) {
          const e = seg(t, q.at, q.at + 0.55, ease.outExpo);
          q.plane.mesh.visible = t >= q.at - 0.01 && fadeWords > 0.01;
          place(q.plane.mesh, [q.pos[0], q.pos[1], q.pos[2] + (1 - e) * 1.6], [(1 - e) * 0.45, (1 - e) * (q.pos[0] > 0 ? -0.4 : 0.4), 0], lerp(1.35, 1, e));
          q.plane.mat.opacity = e * fadeWords;
          if (t > q.at && t < q.at + 0.25) state.glitch = Math.max(state.glitch, 0.35 * (1 - (t - q.at) / 0.25));
          if (t > q.at && t < q.at + 0.3) state.shake = Math.max(state.shake, 0.012 * (1 - (t - q.at) / 0.3));
        }
        const ee = seg(t, elseAt, elseAt + 0.5, ease.outExpo);
        elseTxt.mesh.visible = t >= elseAt;
        place(elseTxt.mesh, [1.0, 2.4, 0.8 + (1 - ee) * 1.2], [0, -0.12, 0.03], lerp(1.3, 1, ee));
        elseTxt.mat.opacity = ee * (1 - seg(t, S2_END - 0.5, S2_END));
        if (t > elseAt && t < elseAt + 0.45) {
          state.glitch = Math.max(state.glitch, 0.8 * (1 - (t - elseAt) / 0.45));
          state.ca = Math.max(state.ca, 0.0016 + 0.01 * (1 - (t - elseAt) / 0.45));
        }
        const be = seg(t, backAt, backAt + 0.6, ease.outQuint);
        backTxt.mesh.visible = t >= backAt;
        place(backTxt.mesh, [1.0, 1.55 - (1 - be) * 0.25, 0.8], [0, -0.12, 0.03], 1);
        backTxt.mat.opacity = be * (1 - seg(t, S2_END - 0.5, S2_END));
        // the customer's phone
        const up = seg(t, 10.9, 11.7, ease.outQuint);
        const out = seg(t, 15.2, 16.1, ease.in);
        const dim = seg(t, elseAt, elseAt + 0.7);
        place(chatA.group, [lerp(0.0, -2.5, dim) - out * 4, lerp(-1.2, 1.35, up) - out * 1.2, lerp(-1, 0.4, up)], [-0.04, lerp(0.35, 0.18, up) + dim * 0.25 + out * 0.8, 0.02 + out * 0.2], 1);
        drawChat(chatA.screen.ctx, "whatsapp", t, scriptA, { status: t >= elseAt + 0.3 ? "last seen today at 00:09" : "online" });
        chatA.screen.tex.needsUpdate = true;
        chatA.group.visible = t >= 10.8;
        state.fade = Math.max(state.fade, seg(t, S2_END - 0.25, S2_END));
      }

      // ---------- 3 ----------
      if (g3.visible) {
        const dt = t - T3;
        bellState.visible = t >= 16.1;
        bellState.pos = [0, 0, 1.5];
        bellState.scale = 0.92;
        bellState.rise = seg(t, 16.15, 16.68, ease.outQuint);
        bellState.ring = pulse(t, T3, 1.1);
        bellState.tilt = dt > 0 ? wobble(dt, 38, 4.2) * 0.05 : 0;
        // the strike pill falls from above and lands exactly on T3
        const fall = clamp((t - (T3 - 0.55)) / 0.55);
        strikePill.visible = t >= T3 - 0.55 && t < T3;
        place(strikePill, [0.05, lerp(5.2, 1.5, ease.in(fall)), 1.6], [0, 0, lerp(0.35, -0.12, fall)], 1);
        const aw = clamp((t - T3) / 0.9);
        strikeAnswer.visible = t >= T3 && aw < 1;
        place(strikeAnswer, [lerp(0.1, -2.9, ease.out(aw)), lerp(1.5, 2.6, ease.out(aw)), 2.0], [0, 0, lerp(0, 0.12, aw)], lerp(0.3, 1, ease.out(clamp(aw * 3))));
        strikeAnswer.material.opacity = 1 - seg(aw, 0.6, 1, ease.in);
        // shockwave rings
        for (const [rg, delay, speed] of [[ringA, 0, 5.2], [ringB, 0.14, 4.0]]) {
          const p = clamp((dt - delay) / 1.5);
          rg.visible = dt > delay && p < 1;
          rg.scale.setScalar(1.3 + p * speed * 1.5);
          rg.material.opacity = (1 - p) ** 2 * 0.85;
        }
        // sparks
        {
          const age = dt;
          sparks.visible = age > 0 && age < 1.8;
          sparks.material.opacity = Math.max(0, 1 - age / 1.8) * 0.9;
          for (let i = 0; i < SPARKS; i++) {
            const v = sparkVel[i];
            const a = Math.max(0, age);
            sparkPos[i * 3] = v[0] * a * (1 - a / 4);
            sparkPos[i * 3 + 1] = 1.3 + v[1] * a - 3.2 * a * a * 0.5;
            sparkPos[i * 3 + 2] = 1.5 + v[2] * a * (1 - a / 4);
          }
          sparkGeo.attributes.position.needsUpdate = true;
        }
        flare.material.opacity = pulse(t, T3, 0.8) * 0.9;
        flare.scale.set(1 + clamp(dt) * 0.8, 1, 1);
        state.flash += pulse(t, T3, 0.22) * 0.14;
        state.bloom += pulse(t, T3, 0.9) * 0.45;
        state.shake = Math.max(state.shake, dt > 0 ? 0.03 * Math.exp(-dt * 9) : 0);
        state.ca = Math.max(state.ca, 0.0016 + pulse(t, T3, 0.5) * 0.008);
        // the wordmark rises out of the floor, letter by letter
        letters.forEach((l, i) => {
          const s = seg(t, T3 + 0.05 + i * 0.07, T3 + 0.85 + i * 0.07, ease.outQuint);
          l.mesh.visible = t >= T3;
          const baseY = 0.28 + l.h * 0.36;
          place(l.mesh, [l.x, baseY - (1 - s) * (l.h * 0.9), -2.6], [0, 0, 0], 1);
          l.mat.opacity = s * (1 - seg(t, 24.4, 25.15));
        });
        const tg = seg(t, vo("s3", 3) - 0.1, vo("s3", 3) + 0.6, ease.outQuint);
        tagline.mesh.visible = tg > 0;
        tagline.mat.opacity = tg * (1 - seg(t, 24.2, 24.8));
        tagline.mesh.position.z = 4.3 - (1 - tg) * 0.8;
        // orbiting pills
        orbiters.forEach(({ mesh, i }) => {
          const a0 = ORBIT_AT + i * 0.18;
          const e = seg(t, a0, a0 + 0.7, ease.outQuint);
          mesh.visible = e > 0;
          const ang = (t - ORBIT_AT) * 0.55 + (i / orbiters.length) * 6.283;
          const rad = 3.3 + Math.sin(i * 1.7) * 0.35;
          const out = seg(t, 23.9 + i * 0.05, 25.0 + i * 0.05, ease.in);
          const x = Math.cos(ang) * rad * (1 + out * 2);
          const z = Math.sin(ang) * rad * 0.8 + out * 6;
          place(mesh, [x, 0.55 + (i % 3) * 0.55 + out * 1.2, z], [0, -ang + 1.57 + 0.2 * Math.sin(i), 0], lerp(0.1, 0.72, e));
          mesh.material.opacity = e * (1 - seg(t, 24.5, 25.1));
        });
        for (const p of PHRASES) {
          const e = seg(t, p.at, p.at + 0.6, ease.outExpo);
          p.plane.mesh.visible = e > 0;
          place(p.plane.mesh, [p.pos[0], p.pos[1] + (1 - e) * 0.5, p.pos[2]], [0, p.pos[0] > 0 ? -0.22 : 0.22, (1 - e) * (p.pos[0] > 0 ? -0.08 : 0.08)], lerp(0.8, 1, e));
          p.plane.mat.opacity = e * (1 - seg(t, 24.2, 24.9));
        }
        // camera: a slow orbit that rises
        const az = keys(t, [[16.1, -0.5], [25.1, 0.45]], ease.inOut);
        const rad = keys(t, [[16.1, 12], [17.3, 9.6], [25.1, 8.6]], ease.inOut);
        const hgt = keys(t, [[16.1, 0.8], [17.3, 1.5], [25.1, 2.5]], ease.inOut);
        camera.position.set(Math.sin(az) * rad, hgt, Math.cos(az) * rad);
        camera.lookAt(0, keys(t, [[16.1, 0.5], [25.1, 0.85]]), 0);
        state.fade = Math.max(state.fade, 1 - seg(t, 16.15, 16.9, ease.out));
        state.fade = Math.max(state.fade, 0);
      }
    },
  };
}
