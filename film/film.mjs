// The Yapoz film, in code. One WebGL scene, a deterministic function of time, rendered frame by frame by render.mjs.
// window.renderFrame(t) draws one frame (with motion blur); window.SFX lists the sound effects; window.cues() the captions.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { W, H, PALETTE as P, rng, glow, makeEnvironment, makeFXPass, makeBell, clamp } from "./kit.mjs";
import { buildOpening } from "./scenes-a.mjs";
import { buildMiddle } from "./scenes-b.mjs";
import { buildClose } from "./scenes-c.mjs";

export const DURATION = 60;
export const FPS = 30;

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(P.ink);
scene.fog = new THREE.Fog(P.ink, 9, 30);
const envTex = makeEnvironment(renderer);
scene.environment = envTex;
scene.environmentIntensity = 0.8;
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.18));
const key = new THREE.DirectionalLight(0xdbe6ff, 1.6);
key.position.set(-3, 6, 5);
scene.add(key);
const rimMint = new THREE.PointLight(0x2cf5bb, 14, 22, 2);
rimMint.position.set(4, 2, 3);
scene.add(rimMint);
const rimCobalt = new THREE.PointLight(0x3f5bff, 22, 26, 2);
rimCobalt.position.set(-4, 1.5, -3);
scene.add(rimCobalt);
const alertLight = new THREE.PointLight(0xff4da6, 0, 18, 2);
alertLight.position.set(0, 2, 3);
scene.add(alertLight);

// the floor: glossy dark glass with a faint grid
const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x04060c, roughness: 0.42, metalness: 0.35, envMapIntensity: 0.07, transparent: true, opacity: 0.88, depthWrite: false }));
// (an explicit envMap is the only way to dim one material's reflections: scene.environment ignores envMapIntensity)
floor.material.envMap = envTex;
floor.material.envMapIntensity = 0.1;
floor.rotation.x = -Math.PI / 2;
floor.renderOrder = -10;
scene.add(floor);
const grid = new THREE.GridHelper(80, 80, 0x22305e, 0x121a36);
grid.position.y = 0.002;
grid.material.transparent = true;
grid.material.opacity = 0.4;
grid.material.depthWrite = false;
grid.renderOrder = -9;
scene.add(grid);

// depth: soft bokeh discs drifting in the dark
const bokehGroup = new THREE.Group();
scene.add(bokehGroup);
{
  const r = rng(7);
  const cols = [P.cobalt, P.ice, P.mint, P.cobalt, P.ice];
  for (let i = 0; i < 46; i++) {
    const g = glow(cols[i % cols.length], 0.6 + r() * 1.8, 0.05 + r() * 0.1);
    g.userData = { base: new THREE.Vector3((r() - 0.5) * 22, 0.2 + r() * 7, -14 + r() * 16), ph: r() * 6.3, sp: 0.1 + r() * 0.25 };
    bokehGroup.add(g);
  }
}

// the bell, shared by several scenes (with a mirrored copy in the floor)
const bell = makeBell();
const bellClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
for (const m of [bell.dome, ...bell.parts.children.map((c) => c.material)]) m.clippingPlanes = [bellClip];
const bellRoot = new THREE.Group();
bellRoot.add(bell.group);
scene.add(bellRoot);
const bellRef = bell.parts.clone(true);
bellRef.scale.y = -1;
bellRef.traverse((o) => {
  if (o.isMesh) {
    o.material = o.material.clone();
    o.material.transparent = true;
    o.material.opacity = 0.28;
    o.material.depthWrite = false;
    o.material.clippingPlanes = null;
  }
});
bellRoot.add(bellRef);

// effects
const composer = new EffectComposer(renderer);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 0.86);
composer.addPass(bloom);
const fx = makeFXPass();
composer.addPass(fx);
composer.addPass(new OutputPass());

// ---------- the shared world ----------
export const SFX = [];
const sfx = (type, t, gain = 1) => SFX.push({ type, t, gain });
const state = { flash: 0, glitch: 0, ca: 0.0016, bloom: 0.55, fade: 0, shake: 0, alert: 0 };
let VO = {};
const vo = (id, i, after = 0) => VO[id].at + VO[id].words[i].t + after;
const voEnd = (id, i) => VO[id].at + VO[id].words[i].t + VO[id].words[i].d;

/** The bell: position, scale, how far it has risen out of the floor, how hard it rings, and how pink it is. */
const bellState = { pos: [0, 0, 0], scale: 1, rise: 1, ring: 0, pink: 0, visible: false, tilt: 0, spin: 0, floating: false };

const world = { THREE, scene, camera, state, vo, voEnd, sfx, bell, bellState, bokehGroup, floor, grid, key, rimMint, rimCobalt, alertLight, renderer };
const parts = [];

function applyBell(t) {
  const b = bellState;
  bellRoot.visible = b.visible;
  bellRoot.position.set(...b.pos);
  bellRoot.scale.setScalar(b.scale);
  bellRoot.rotation.y = b.spin;
  bell.group.rotation.z = b.tilt;
  bellClip.constant = -b.pos[1] + 0.001 - (1 - b.rise) * 0;
  // risen: lift the model, then clip everything below the floor
  bell.group.position.y = -(1 - b.rise) * 1.6;
  bellRef.position.y = (1 - b.rise) * 1.6;
  bellRef.visible = !b.floating;
  const k = b.ring;
  bell.dome.emissive.set(b.pink > 0.01 ? P.pink : P.cobalt);
  bell.dome.emissiveIntensity = Math.max(k * 0.9, b.pink * 1.6);
  bell.rimMat.color.set(b.pink > 0.01 ? P.pink : P.cobalt).multiplyScalar(1 + k * 3 + b.pink * 3);
  void t;
}

function update(t) {
  state.flash = 0;
  state.glitch = 0;
  state.ca = 0.0016;
  state.bloom = 0.55;
  state.fade = 0;
  state.shake = 0;
  state.alert = 0;
  bellState.visible = false;
  bellState.ring = 0;
  bellState.pink = 0;
  bellState.tilt = 0;
  bellState.spin = 0;
  bellState.floating = false;
  for (const p of parts) p.update(t);
  for (const g of bokehGroup.children) {
    const u = g.userData;
    g.position.set(u.base.x + Math.sin(t * u.sp + u.ph) * 0.5, u.base.y + Math.cos(t * u.sp * 0.8 + u.ph) * 0.35, u.base.z);
    g.lookAt(camera.position);
  }
  applyBell(t);
  alertLight.intensity = state.alert * 30;
  // a little handheld sway, so no shot is ever perfectly still
  camera.position.x += Math.sin(t * 0.63) * 0.035;
  camera.position.y += Math.sin(t * 0.47 + 1.3) * 0.025;
  if (state.shake > 0) {
    camera.position.x += Math.sin(t * 61.3) * state.shake;
    camera.position.y += Math.cos(t * 53.1) * state.shake;
  }
  bloom.strength = state.bloom;
  fx.uniforms.time.value = t % 7.77;
  fx.uniforms.flash.value = clamp(state.flash, 0, 1.2);
  fx.uniforms.glitch.value = state.glitch;
  fx.uniforms.ca.value = state.ca;
  fx.uniforms.fade.value = clamp(state.fade);
}

// ---------- output ----------
const out = document.getElementById("out");
const octx = out.getContext("2d");
window.DURATION = DURATION;
window.SFX = SFX;
window.cues = () => CUES;
/** Draw frame t, averaging `n` sub-frames across a 180-degree shutter for motion blur. */
window.renderFrame = (t, n = 1) => {
  const shutter = 0.5 / FPS;
  for (let k = 0; k < n; k++) {
    const tt = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * shutter;
    update(tt);
    composer.render();
    octx.globalAlpha = 1 / (k + 1);
    octx.drawImage(renderer.domElement, 0, 0);
  }
  octx.globalAlpha = 1;
};

let CUES = [];
async function load() {
  await Promise.all(["850 80px Anybody", "italic 800 80px Anybody", "500 40px 'Familjen Grotesk'", "400 40px 'Martian Mono'"].map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  const lines = await (await fetch("lines.json")).json();
  for (const l of lines) {
    const words = await (await fetch(`voice/${l.id}.json`)).json();
    VO[l.id] = { at: l.at, words, end: l.end };
    let i = 0;
    for (const [text, n] of l.caps ?? []) {
      const first = words[i];
      const last = words[i + n - 1];
      CUES.push({ from: l.at + first.t - 0.05, to: l.at + last.t + last.d + 0.3, text });
      i += n;
    }
  }
  CUES.sort((a, b) => a.from - b.from);
  for (let k = 0; k < CUES.length - 1; k++) if (CUES[k + 1].from - CUES[k].to < 0.5) CUES[k].to = CUES[k + 1].from;
  parts.push(buildOpening(world), buildMiddle(world), buildClose(world));
  update(0);
  composer.render();
}
window.ready = load();
