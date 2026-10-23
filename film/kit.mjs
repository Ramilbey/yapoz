// Small toolbox for the film: easing and keyframes, canvas textures, text planes, phones, the bell, lights and post-processing.
// Everything is a pure function of time so any frame can be rendered on its own, in any order.
import * as THREE from "three";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

export const W = 1920;
export const H = 1080;
export const PALETTE = { ink: "#06080E", panel: "#0C111C", raised: "#141B2B", line: "#1F2840", frost: "#EAF0FB", fog: "#B3BDD2", smoke: "#8591AC", cobalt: "#3F5BFF", ice: "#8DA0FF", mint: "#2CF5BB", pink: "#FF4DA6" };

// ---------- maths ----------
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  lin: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  back: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  elastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1),
};
/** Progress 0..1 of the window [a, b], eased. */
export const seg = (t, a, b, e = ease.inOut) => e(clamp((t - a) / (b - a)));
/** Keyframes: [[time, value], ...], eased between neighbours. */
export function keys(t, arr, e = ease.inOut) {
  if (t <= arr[0][0]) return arr[0][1];
  for (let i = 0; i < arr.length - 1; i++) {
    if (t <= arr[i + 1][0]) return lerp(arr[i][1], arr[i + 1][1], e((t - arr[i][0]) / (arr[i + 1][0] - arr[i][0])));
  }
  return arr[arr.length - 1][1];
}
export const keys3 = (t, arr, e) => [0, 1, 2].map((i) => keys(t, arr.map(([tt, v]) => [tt, v[i]]), e));
export const rng = (seed) => {
  let s = (seed >>> 0) || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};
/** A decaying wobble that starts at time 0: use with (t - eventTime). */
export const wobble = (t, freq = 38, decay = 7) => (t < 0 ? 0 : Math.exp(-decay * t) * Math.sin(freq * t));
/** A short pulse that rises at `at` and fades over `len`. */
export const pulse = (t, at, len = 0.5) => (t < at ? 0 : Math.exp(-(t - at) / (len / 3)));

// ---------- canvas textures ----------
export function canvasTexture(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return { c, ctx, tex };
}
export const rr = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};
export function wrapText(ctx, text, maxW) {
  const out = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      out.push(line);
      line = word;
    } else line = test;
  }
  if (line) out.push(line);
  return out;
}

const PX_PER_UNIT = 480;
/** A flat plane carrying text. `stretch` is a CSS font-stretch keyword (Anybody's width axis). */
export function textPlane({ text, font = "Anybody", weight = 850, style = "normal", stretch = "expanded", size = 200, color = PALETTE.frost, gradient = null, stroke = null, strokeW = 3, tracking = -0.03, align = "center", pad = 24, opacity = 1 }) {
  const probe = document.createElement("canvas").getContext("2d");
  const set = (g) => {
    g.font = `${style} ${weight} ${size}px "${font}"`;
    g.fontStretch = stretch;
    g.letterSpacing = `${tracking * size}px`;
  };
  set(probe);
  const m = probe.measureText(text);
  const w = Math.ceil(m.width + pad * 2 + size * 0.1);
  const h = Math.ceil(size * 1.35 + pad * 2);
  const { c, ctx, tex } = canvasTexture(w, h);
  set(ctx);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = align === "left" ? "left" : align === "right" ? "right" : "center";
  const x = align === "left" ? pad : align === "right" ? w - pad : w / 2;
  const y = pad + size * 1.02;
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeW;
    ctx.lineJoin = "round";
    ctx.strokeText(text, x, y);
  } else {
    if (gradient) {
      const gr = ctx.createLinearGradient(0, pad + size * 0.2, 0, pad + size * 1.05);
      gr.addColorStop(0, gradient[0]);
      gr.addColorStop(1, gradient[1]);
      ctx.fillStyle = gr;
    } else ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, opacity });
  mat.color.setScalar(0.82);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w / PX_PER_UNIT, h / PX_PER_UNIT), mat);
  return { mesh, mat, w: w / PX_PER_UNIT, h: h / PX_PER_UNIT, c, tex };
}

export const glowTexture = (() => {
  let t;
  return () => {
    if (t) return t;
    const { ctx, tex } = canvasTexture(256, 256);
    const r = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.25, "rgba(255,255,255,0.35)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, 256, 256);
    tex.needsUpdate = true;
    return (t = tex);
  };
})();
export function glow(color, size = 3, opacity = 0.6) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  return m;
}
/** A horizontal anamorphic streak: the flare cinematographers love. */
export const streakTexture = (() => {
  let t;
  return () => {
    if (t) return t;
    const { ctx, tex } = canvasTexture(1024, 64);
    const g = ctx.createLinearGradient(0, 0, 1024, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 28, 1024, 8);
    const v = ctx.createLinearGradient(0, 0, 0, 64);
    v.addColorStop(0, "rgba(0,0,0,1)");
    v.addColorStop(0.5, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 1024, 64);
    tex.needsUpdate = true;
    return (t = tex);
  };
})();
export function streak(color, w = 8, h = 0.25, opacity = 0.8) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: streakTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
}

// ---------- the phone ----------
const roundedShape = (w, h, r) => {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
};
export const PHONE = { w: 1, h: 2.06, d: 0.085, r: 0.17, sw: 0.955, sh: 2.015 };
export const SCREEN_PX = { w: 720, h: 1520 };
/** A dark-titanium phone whose screen is a canvas texture. Draw into `screen.ctx`, then set `screen.tex.needsUpdate = true`. */
export function makePhone({ rim = PALETTE.ink } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedShape(PHONE.w, PHONE.h, PHONE.r), { depth: PHONE.d, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.014, bevelSegments: 5, curveSegments: 24 }),
    new THREE.MeshPhysicalMaterial({ color: 0x1a2133, metalness: 1, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
  );
  body.position.z = -PHONE.d / 2;
  g.add(body);
  const sg = new THREE.ShapeGeometry(roundedShape(PHONE.sw, PHONE.sh, PHONE.r - 0.025), 24);
  const pos = sg.attributes.position;
  const uv = sg.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + PHONE.sw / 2) / PHONE.sw, (pos.getY(i) + PHONE.sh / 2) / PHONE.sh);
  const screen = canvasTexture(SCREEN_PX.w, SCREEN_PX.h);
  screen.ctx.fillStyle = rim;
  screen.ctx.fillRect(0, 0, SCREEN_PX.w, SCREEN_PX.h);
  const face = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  face.position.z = PHONE.d / 2 + 0.016;
  g.add(face);
  const glass = new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false }));
  glass.position.z = PHONE.d / 2 + 0.02;
  g.add(glass);
  const halo = glow(PALETTE.cobalt, 3.0, 0.0);
  halo.position.z = -0.4;
  g.add(halo);
  return { group: g, screen, halo, face };
}

// ---------- the bell ----------
export function makeBell() {
  const g = new THREE.Group();
  const R = 1.0;
  const Hh = 0.95;
  const pts = [new THREE.Vector2(R + 0.05, 0), new THREE.Vector2(R + 0.045, 0.035)];
  for (let i = 0; i <= 40; i++) {
    const th = (i / 40) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R * Math.cos(th) ** 0.92, 0.04 + (Hh - 0.04) * Math.sin(th) ** 1.08));
  }
  pts.push(new THREE.Vector2(0, Hh));
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  const dome = new THREE.MeshPhysicalMaterial({ color: 0xdfe7fb, metalness: 1, roughness: 0.15, clearcoat: 0.5, clearcoatRoughness: 0.12, envMapIntensity: 1.25, emissive: new THREE.Color(PALETTE.cobalt), emissiveIntensity: 0 });
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xdfe7fb, metalness: 1, roughness: 0.16 });
  const parts = new THREE.Group();
  parts.add(new THREE.Mesh(geo, dome));
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.18, 32), chrome);
  stem.position.y = Hh + 0.08;
  parts.add(stem);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.17, 40, 24), chrome);
  knob.scale.y = 0.55;
  knob.position.y = Hh + 0.2;
  parts.add(knob);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.34, 0.18, 96), new THREE.MeshPhysicalMaterial({ color: 0x05070d, metalness: 0.4, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1 }));
  base.position.y = -0.09;
  parts.add(base);
  const rimMat = new THREE.MeshBasicMaterial({ color: PALETTE.cobalt, toneMapped: false });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.285, 0.014, 12, 128), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.004;
  parts.add(rim);
  g.add(parts);
  return { group: g, parts, dome, rimMat, height: Hh + 0.3 };
}

// ---------- the studio ----------
export function makeEnvironment(renderer) {
  const s = new THREE.Scene();
  const box = (w, h, pos, rot, color, intensity) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.rotation.set(...rot);
    s.add(m);
  };
  box(9, 1.6, [0, 7, 0], [Math.PI / 2, 0, 0], "#eef3ff", 2.4);
  box(1.2, 9, [-7, 2, 3], [0, Math.PI / 2.4, 0], "#b9c8ff", 1.8);
  box(1.0, 7, [7, 1.5, -1], [0, -Math.PI / 2.4, 0], "#7ff5d6", 2.0);
  box(10, 1, [0, 3, -8], [0, 0, 0], "#ffffff", 1.2);
  box(1.2, 6, [3, 2, 7], [0, Math.PI, 0], "#c7d2ff", 1.0);
  box(16, 8, [0, -5, 0], [-Math.PI / 2, 0, 0], "#3f5bff", 0.6);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.02).texture;
  pm.dispose();
  return tex;
}

// ---------- post-processing ----------
export const FXShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, ca: { value: 0.0015 }, vignette: { value: 0.55 }, grain: { value: 0.02 }, flash: { value: 0 }, glitch: { value: 0 }, fade: { value: 0 }, tint: { value: new THREE.Vector3(0, 0, 0) } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, ca, vignette, grain, flash, glitch, fade; uniform vec3 tint; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      // glitch: horizontal slices slide sideways
      float slice = floor(uv.y * 28.0);
      float g = step(0.72, hash(vec2(slice, floor(time * 24.0)))) * glitch;
      uv.x += g * (hash(vec2(slice, 3.0)) - 0.5) * 0.12;
      vec2 d = uv - 0.5;
      float r2 = dot(d, d);
      float k = ca * (1.0 + r2 * 6.0) + g * 0.01;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + d * k).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - d * k).b;
      col += tint * 0.0;
      col *= 1.0 - vignette * smoothstep(0.18, 0.95, r2 * 2.2);
      col += (hash(uv * vec2(1920.0, 1080.0) + time) - 0.5) * grain;
      col += flash * vec3(0.78, 0.86, 1.0);
      col *= 1.0 - fade;
      gl_FragColor = vec4(col, 1.0);
    }`,
};
export const makeFXPass = () => new ShaderPass(FXShader);
