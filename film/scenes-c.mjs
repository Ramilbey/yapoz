// Scenes 6 to 8: orders wait for your yes (0:43), it knows when to stop (0:50), close (0:57).
import { PALETTE as P, clamp, lerp, ease, seg, keys, keys3, pulse, wobble, canvasTexture, textPlane, makePhone, glow, rr, streak } from "./kit.mjs";
import { drawChat, drawOrders, drawNeeds } from "./ui.mjs";

export function buildClose(world) {
  const { THREE, scene, camera, state, vo, sfx, bellState } = world;
  const g6 = new THREE.Group();
  const g7 = new THREE.Group();
  const g8 = new THREE.Group();
  scene.add(g6, g7, g8);
  const lookAt = new THREE.Vector3();
  const place = (o, pos, rot = [0, 0, 0], s = 1) => {
    o.position.set(...pos);
    o.rotation.set(...rot);
    o.scale.setScalar(s);
  };
  const pill = (text, bg, fg, w = 1.6, h = 0.4) => {
    const cv = canvasTexture(1024, Math.round((1024 * h) / w));
    const ctx = cv.ctx;
    const ph = cv.c.height;
    ctx.fillStyle = bg;
    rr(ctx, 4, 4, 1016, ph - 8, (ph - 8) / 2);
    ctx.fill();
    ctx.fillStyle = fg;
    let size = Math.round(ph * 0.32);
    ctx.font = `600 ${size}px "Familjen Grotesk"`;
    while (ctx.measureText(text).width > 900 && size > 24) {
      size -= 3;
      ctx.font = `600 ${size}px "Familjen Grotesk"`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 512, ph / 2 + 4);
    cv.tex.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: cv.tex, transparent: true, toneMapped: false, depthWrite: false }));
    m.material.color.setScalar(0.85);
    return m;
  };
  const arc = (a, b, lift, e) => {
    const mid = a.clone().lerp(b, 0.5);
    mid.y += lift;
    const p1 = a.clone().lerp(mid, e);
    const p2 = mid.clone().lerp(b, e);
    return p1.lerp(p2, e);
  };

  // ================= 6 · orders wait for your yes =================
  const owner = makePhone();
  const cust = makePhone();
  owner.halo.material.color.set(P.cobalt);
  cust.halo.material.color.set("#D62976");
  g6.add(owner.group, cust.group);
  const bookAt = vo("s6", 0) + 0.45;
  const cardAt = vo("s6", 6) - 0.1;
  const tapAt = vo("s6", 18) - 0.12;
  const confirmAt = tapAt + 0.1;
  const msgAt = tapAt + 1.05;
  const custScript = [
    { who: "me", text: "2 large margherita, pickup at 8?", at: 0, time: "23:52" },
    { who: "biz", text: "Got it: 2 × Large Margherita, pickup 20:00, RM 104. I've sent it to the team to confirm.", at: 1, time: "23:52" },
    { who: "biz", text: "Your order ORD-7KQ2 is confirmed. We'll let you know when it's ready for pickup.", at: msgAt, typeFrom: msgAt - 0.9, time: "23:54" },
  ];
  sfx("whoosh", 42.8, 0.7);
  sfx("pop", bookAt + 0.1, 0.8);
  sfx("whoosh", cardAt, 0.6);
  sfx("click", tapAt + 0.02, 1);
  sfx("ding", tapAt + 0.08, 0.6);
  sfx("pop", msgAt, 0.9);
  const txtFree = textPlane({ text: "Real free slots.", font: "Anybody", style: "italic", weight: 800, stretch: "extra-condensed", size: 280, color: P.mint, tracking: -0.01 });
  const txtYes = textPlane({ text: "Orders wait for your yes.", size: 150, color: P.frost });
  g6.add(txtFree.mesh, txtYes.mesh);
  const freeAt = vo("s6", 3) - 0.05;
  const yesAt = vo("s6", 6) - 0.05;
  sfx("tick", freeAt, 1);
  sfx("tick", yesAt, 1);
  const finger = glow("#ffffff", 0.7, 0.0);
  g6.add(finger);
  const sentPill = pill("Your order is confirmed", P.mint, P.ink, 1.5, 0.38);
  g6.add(sentPill);
  const tmp = new THREE.Vector3();

  // ================= 7 · it knows when to stop =================
  const cust7 = makePhone();
  const own7 = makePhone();
  cust7.halo.material.color.set("#25D366");
  own7.halo.material.color.set(P.pink);
  g7.add(cust7.group, own7.group);
  const T7 = {
    msg: 50.95,
    hit: 51.75,
    needs: vo("s7", 5) + 0.55,
    hold: vo("s7", 10) - 0.15,
  };
  const script7 = [
    { who: "me", text: "Can I get a refund? Last night's pizza was cold.", at: T7.msg, time: "09:12" },
    { who: "biz", text: "Sorry about that. I've passed this to the manager, who will reply to you here.", at: T7.hold + 0.85, typeFrom: T7.hold - 0.1, time: "09:12" },
  ];
  sfx("pop", T7.msg, 0.8);
  sfx("alert", T7.hit, 1);
  sfx("thud", T7.hit, 0.7);
  sfx("whoosh", T7.hit + 0.1, 0.5);
  sfx("pop", T7.needs + 0.7, 0.9);
  sfx("whoosh", T7.hold, 0.5);
  sfx("pop", T7.hold + 0.85, 0.9);
  const refundPill = pill("Can I get a refund?", "#EAF0FB", P.ink, 1.7, 0.4);
  const needsPill = pill("Needs you: refund", P.pink, P.ink, 1.7, 0.4);
  const holdPill = pill("Holding reply sent", P.mint, P.ink, 1.7, 0.4);
  g7.add(refundPill, needsPill, holdPill);
  const txtSure = textPlane({ text: "Not sure?", font: "Anybody", style: "italic", weight: 800, stretch: "extra-condensed", size: 330, color: P.pink, tracking: -0.01 });
  const txtAsks = textPlane({ text: "It asks you.", size: 170, color: P.frost });
  const txtNone = textPlane({ text: "Nothing is invented.", font: "Martian Mono", weight: 500, stretch: "normal", size: 70, color: P.fog, tracking: 0.06 });
  g7.add(txtSure.mesh, txtAsks.mesh, txtNone.mesh);
  const sureAt = vo("s7", 0) - 0.05;
  const asksAt = vo("s7", 5) - 0.05;
  const noneAt = vo("s7", 14) - 0.05;
  sfx("tick", sureAt, 1);
  sfx("tick", asksAt, 1);
  sfx("tick", noneAt, 1);

  // ================= 8 · close =================
  const letters = "Yapoz".split("").map((ch) => {
    const p = textPlane({ text: ch, size: 600, gradient: ["#F4F7FF", "#6F86FF"], tracking: -0.04, pad: 8 });
    g8.add(p.mesh);
    return p;
  });
  {
    const total = letters.reduce((s, l) => s + l.w * 0.8, 0);
    let cx = -total / 2;
    letters.forEach((l) => {
      l.x = cx + (l.w * 0.8) / 2;
      cx += l.w * 0.8;
    });
  }
  const tagA = textPlane({ text: "Every question,", size: 150, color: P.frost });
  const tagB = textPlane({ text: "answered.", font: "Anybody", style: "italic", weight: 800, stretch: "extra-condensed", size: 250, color: P.mint, tracking: -0.01 });
  const cta = textPlane({ text: "SIGN UP FREE AT YAPOZ.VERCEL.APP", font: "Martian Mono", weight: 500, stretch: "normal", size: 70, color: P.frost, tracking: 0.1 });
  cta.mesh.rotation.x = -Math.PI / 2;
  g8.add(tagA.mesh, tagB.mesh, cta.mesh);
  const T8 = vo("s8", 0) - 0.05;
  sfx("ding", T8, 1);
  sfx("tick", vo("s8", 1), 1);
  sfx("ding", vo("s8", 3) - 0.02, 0.5);
  const ring8 = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 128), new THREE.MeshBasicMaterial({ color: P.mint, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  ring8.rotation.x = -Math.PI / 2;
  ring8.position.y = 0.02;
  g8.add(ring8);

  return {
    update(t) {
      g6.visible = t >= 42.6 && t < 50.4;
      g7.visible = t >= 49.7 && t < 57.4;
      g8.visible = t >= 56.7;

      // ---------- 6 ----------
      if (g6.visible) {
        const enter = seg(t, 42.9, 43.8, ease.outQuint);
        const leave = seg(t, 49.55, 50.3, ease.in);
        camera.position.set(...keys3(t, [[42.8, [0.3, 1.9, 7.2]], [46, [0.3, 1.85, 6.5]], [50.2, [0.1, 1.8, 5.9]]], ease.inOut));
        lookAt.set(...keys3(t, [[42.8, [0.3, 1.7, 0]], [50.2, [0.5, 1.7, 0]]]));
        camera.lookAt(lookAt);
        place(owner.group, [-1.3, lerp(-1.5, 1.6, enter) - leave * 2.8, 0.1], [-0.03, lerp(0.7, 0.2, enter) + leave * 0.4, 0.02], 1.32);
        place(cust.group, [lerp(4.5, 2.1, enter) + leave * 3.5, 1.5 - leave * 2.0, -0.5], [-0.02, lerp(-0.9, -0.38, enter), -0.02], 1.12);
        owner.halo.material.opacity = 0.15;
        cust.halo.material.opacity = 0.14;
        drawOrders(owner.screen.ctx, t, { bookAt, cardAt, tapAt, confirmAt });
        owner.screen.tex.needsUpdate = true;
        drawChat(cust.screen.ctx, "instagram", t, custScript, { seenAt: msgAt + 0.5 });
        cust.screen.tex.needsUpdate = true;
        // title words
        const fe = seg(t, freeAt, freeAt + 0.6, ease.outExpo) * (1 - seg(t, yesAt - 0.15, yesAt + 0.2));
        txtFree.mesh.visible = fe > 0.01;
        place(txtFree.mesh, [-0.2, 3.2 - (1 - fe) * 0.35, -0.6], [0, 0.08, 0], 0.85);
        txtFree.mat.opacity = fe;
        const ye = seg(t, yesAt, yesAt + 0.6, ease.outExpo) * (1 - seg(t, 49.2, 49.7));
        txtYes.mesh.visible = ye > 0.01;
        place(txtYes.mesh, [-0.2, 3.15 - (1 - ye) * 0.35, -0.6], [0, 0.08, 0], 0.85);
        txtYes.mat.opacity = ye;
        // the finger that taps Confirm
        const target = owner.group.localToWorld(new THREE.Vector3(-0.162, 0.03, 0.09));
        const fin = seg(t, tapAt - 1.1, tapAt - 0.05, ease.inOut);
        const press = pulse(t, tapAt, 0.18);
        tmp.set(target.x + (1 - fin) * 0.75, target.y - (1 - fin) * 0.6, target.z + 0.25 + (1 - fin) * 0.4);
        finger.position.copy(tmp);
        finger.lookAt(camera.position);
        finger.scale.setScalar(0.9 - press * 0.35);
        finger.material.opacity = seg(t, tapAt - 1.2, tapAt - 0.7) * (1 - seg(t, tapAt + 0.35, tapAt + 0.7)) * 0.55;
        finger.visible = finger.material.opacity > 0.01;
        // the confirmation flies to the customer
        const fp = (t - (tapAt + 0.12)) / 0.85;
        sentPill.visible = fp > 0 && fp < 1;
        if (sentPill.visible) {
          const e = ease.inOut(clamp(fp));
          const a = owner.group.localToWorld(new THREE.Vector3(-0.1, 0.05, 0.1));
          const b = cust.group.localToWorld(new THREE.Vector3(0, -0.5, 0.1));
          const pos = arc(a, b, 0.9, e);
          sentPill.position.copy(pos);
          sentPill.scale.setScalar(lerp(0.4, 1, ease.out(clamp(fp * 3))) * (1 - seg(fp, 0.85, 1) * 0.6));
          sentPill.rotation.set(0, lerp(0, -0.3, e), lerp(0, 0.15, Math.sin(e * 3.1)));
          sentPill.material.opacity = 1 - seg(fp, 0.8, 1);
        }
        state.flash += pulse(t, tapAt + 0.08, 0.15) * 0.1;
        if (t > 49.8) state.glitch = Math.max(state.glitch, seg(t, 49.8, 50.05, ease.lin) * (1 - seg(t, 50.05, 50.3, ease.lin)) * 0.9);
        state.fade = Math.max(state.fade, 0);
      }

      // ---------- 7 ----------
      if (g7.visible) {
        const enter = seg(t, 50.0, 50.8, ease.outQuint);
        const leave = seg(t, 56.5, 57.1, ease.in);
        const hit = t - T7.hit;
        camera.position.set(...keys3(t, [[50.0, [0.0, 1.5, 8.2]], [51.7, [0.0, 1.6, 7.5]], [57.0, [0.4, 2.0, 7.0]]], ease.inOut));
        lookAt.set(...keys3(t, [[50, [0, 1.45, 0]], [57, [0, 1.45, 0]]]));
        camera.lookAt(lookAt);
        place(cust7.group, [lerp(-5, -2.65, enter) - leave * 3, 1.5 - leave * 2.4, -0.4], [-0.02, lerp(0.9, 0.34, enter), 0.02], 1.28);
        place(own7.group, [lerp(5, 2.65, enter) + leave * 3, 1.5 - leave * 2.4, -0.4], [-0.02, lerp(-0.9, -0.34, enter), -0.02], 1.28);
        cust7.halo.material.opacity = 0.14;
        own7.halo.material.opacity = t > T7.needs ? 0.2 : 0.1;
        drawChat(cust7.screen.ctx, "whatsapp", t, script7);
        cust7.screen.tex.needsUpdate = true;
        drawNeeds(own7.screen.ctx, t, { itemAt: T7.needs + 0.75 });
        own7.screen.tex.needsUpdate = true;
        // the bell: rises, takes the hit, and goes quiet
        bellState.visible = true;
        bellState.pos = [0, 0, 0.6];
        bellState.scale = 0.9;
        bellState.rise = seg(t, 50.0, 50.7, ease.outQuint);
        bellState.pink = hit > 0 ? Math.max(0, 1 - hit / 1.8) ** 1.5 : 0;
        bellState.ring = hit > 0 ? pulse(t, T7.hit, 0.6) * 0.6 : 0;
        bellState.tilt = hit > 0 ? wobble(hit, 44, 5) * 0.05 : 0;
        bellState.spin = 0.5;
        if (hit > -0.05) {
          state.alert = Math.max(state.alert, Math.max(0, 1 - hit / 1.6));
          state.shake = Math.max(state.shake, hit > 0 ? 0.035 * Math.exp(-hit * 9) : 0);
          state.glitch = Math.max(state.glitch, hit > 0 && hit < 0.4 ? 0.9 * (1 - hit / 0.4) : 0);
          state.ca = Math.max(state.ca, 0.0016 + (hit > 0 ? pulse(t, T7.hit, 0.5) * 0.012 : 0));
          state.flash += hit > 0 ? pulse(t, T7.hit, 0.2) * 0.1 : 0;
          state.bloom += hit > 0 ? pulse(t, T7.hit, 0.7) * 0.4 : 0;
        }
        // the refund message goes in, the two answers come out
        const rp = (t - (T7.msg + 0.1)) / 0.65;
        refundPill.visible = rp > 0 && rp < 1;
        if (refundPill.visible) {
          const e = ease.in(clamp(rp));
          const a = cust7.group.localToWorld(new THREE.Vector3(0.2, -0.45, 0.1));
          const b = new THREE.Vector3(0, 1.1, 0.9);
          refundPill.position.copy(arc(a, b, 0.7, e));
          refundPill.scale.setScalar(lerp(0.6, 0.85, e));
          refundPill.rotation.z = lerp(0.1, -0.05, e);
          refundPill.material.opacity = 1 - seg(rp, 0.9, 1);
        }
        const np = (t - (T7.needs - 0.55)) / 0.85;
        needsPill.visible = np > 0 && np < 1;
        if (needsPill.visible) {
          const e = ease.inOut(clamp(np));
          const a = new THREE.Vector3(0.2, 1.3, 0.9);
          const b = own7.group.localToWorld(new THREE.Vector3(0, 0.45, 0.1));
          needsPill.position.copy(arc(a, b, 0.9, e));
          needsPill.scale.setScalar(lerp(0.4, 0.9, ease.out(clamp(np * 2.5))));
          needsPill.rotation.z = lerp(-0.1, 0.12, e);
          needsPill.material.opacity = 1 - seg(np, 0.88, 1);
        }
        const hp = (t - (T7.hold - 0.55)) / 0.85;
        holdPill.visible = hp > 0 && hp < 1;
        if (holdPill.visible) {
          const e = ease.inOut(clamp(hp));
          const a = new THREE.Vector3(-0.2, 1.25, 0.9);
          const b = cust7.group.localToWorld(new THREE.Vector3(0.1, -0.3, 0.1));
          holdPill.position.copy(arc(a, b, 0.8, e));
          holdPill.scale.setScalar(lerp(0.4, 0.9, ease.out(clamp(hp * 2.5))));
          holdPill.rotation.z = lerp(0.1, -0.1, e);
          holdPill.material.opacity = 1 - seg(hp, 0.88, 1);
        }
        // type
        const se = seg(t, sureAt, sureAt + 0.6, ease.outExpo) * (1 - seg(t, asksAt - 0.1, asksAt + 0.25));
        txtSure.mesh.visible = se > 0.01;
        place(txtSure.mesh, [0, 3.25 - (1 - se) * 0.3, -1.0], [0, 0, 0], lerp(1.2, 0.9, se));
        txtSure.mat.opacity = se;
        const ae = seg(t, asksAt, asksAt + 0.6, ease.outExpo) * (1 - seg(t, 54.6, 54.95));
        txtAsks.mesh.visible = ae > 0.01;
        place(txtAsks.mesh, [0, 3.2 - (1 - ae) * 0.3, -1.0], [0, 0, 0], 0.9);
        txtAsks.mat.opacity = ae;
        const ne = seg(t, noneAt, noneAt + 0.7, ease.outQuint) * (1 - seg(t, 56.4, 56.9));
        txtNone.mesh.visible = ne > 0.01;
        place(txtNone.mesh, [0, 3.15, -1.0], [0, 0, 0], 1);
        txtNone.mat.opacity = ne;
        if (t > 56.7) state.glitch = Math.max(state.glitch, seg(t, 56.7, 56.95, ease.lin) * (1 - seg(t, 56.95, 57.2, ease.lin)) * 0.9);
      }

      // ---------- 8 ----------
      if (g8.visible) {
        const dt = t - T8;
        bellState.visible = true;
        const settle = seg(t, 56.7, 57.6, ease.inOut);
        bellState.pos = [0, 0, lerp(0.6, 1.3, settle)];
        bellState.scale = lerp(0.9, 0.82, settle);
        bellState.rise = 1;
        bellState.ring = pulse(t, T8, 1.0);
        bellState.tilt = dt > 0 ? wobble(dt, 38, 4.2) * 0.05 : 0;
        bellState.spin = 0.5;
        const camE = seg(t, 57.0, 60.0, ease.inOut);
        camera.position.set(0, lerp(1.9, 2.9, camE), lerp(8.4, 10.4, camE));
        camera.lookAt(0, lerp(1.0, 1.1, camE), 0);
        letters.forEach((l, i) => {
          const s = seg(t, T8 + 0.04 + i * 0.07, T8 + 0.85 + i * 0.07, ease.outQuint);
          l.mesh.visible = t >= T8;
          place(l.mesh, [l.x, 0.28 + l.h * 0.36 + 0.55 - (1 - s) * (l.h * 0.9), -2.6], [0, 0, 0], 1);
          l.mat.opacity = s;
          l.mat.clippingPlanes = world.bell.dome.clippingPlanes;
        });
        const ra = seg(t, vo("s8", 1) - 0.05, vo("s8", 1) + 0.6, ease.outExpo);
        tagA.mesh.visible = ra > 0.01;
        place(tagA.mesh, [-1.3, 3.15 + (1 - ra) * -0.3, -1.4], [0, 0.04, 0], 1);
        tagA.mat.opacity = ra;
        const rb = seg(t, vo("s8", 3) - 0.05, vo("s8", 3) + 0.6, ease.outExpo);
        tagB.mesh.visible = rb > 0.01;
        place(tagB.mesh, [1.55, 3.1 + (1 - rb) * -0.3, -1.4], [0, 0.04, 0], lerp(1.2, 1, rb));
        tagB.mat.opacity = rb;
        const ce = seg(t, 58.6, 59.2, ease.outQuint);
        cta.mesh.visible = ce > 0.01;
        place(cta.mesh, [0, 0.014, 4.1 - (1 - ce) * 0.6], [-Math.PI / 2, 0, 0], 1);
        cta.mat.opacity = ce;
        const rp = clamp(dt / 1.5);
        ring8.visible = dt > 0 && rp < 1;
        ring8.position.z = 1.3;
        ring8.scale.setScalar(1.3 + rp * 7);
        ring8.material.opacity = (1 - rp) ** 2 * 0.7;
        state.flash += pulse(t, T8, 0.2) * 0.1;
        state.bloom += pulse(t, T8, 0.8) * 0.3;
        state.shake = Math.max(state.shake, dt > 0 ? 0.02 * Math.exp(-dt * 9) : 0);
        state.fade = Math.max(state.fade, seg(t, 59.5, 59.98, ease.in));
        state.fade = Math.max(state.fade, 1 - seg(t, 56.75, 57.05, ease.out) < 0.001 ? 0 : 0);
        void streak;
      }
    },
  };
}
