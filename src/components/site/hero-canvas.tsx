"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { ding } from "./sound";
import { StaticBell } from "./chrome";

const CHROME = new THREE.Color("#dfe7fb");
const INK = "#06080E";
const MINT = "#2CF5BB";
const COBALT = "#3F5BFF";

const PAIRS: [string, string][] = [
  ["haircut tmr 3pm?", "Booked: Thu 3pm with Amanda"],
  ["large margherita how much", "RM 52, ready in 15 min"],
  ["got size M in red?", "Red M: 6 in stock"],
  ["open on monday?", "Closed Mondays, sorry"],
  ["room for 2 this sat?", "1 Deluxe left, RM 260"],
  ["deliver to bangsar?", "Yes: RM 5, about 40 min"],
  ["iphone 13 screen how much", "RM 380, done in 1 hour"],
  ["table for 4 fri 8pm?", "Booked: Fri 8pm, 4 people"],
  ["u guys halal ah?", "Halal-certified kitchen"],
];

const BELL_X = 3.0;
const DOME_H = 0.95;
const DOME_R = 1.0;

type RingState = { t: number; amp: number };

/** Just the words: no pill, no box. A soft shadow keeps them readable over the bell and the counter. */
function textTexture(text: string, fg: string) {
  const c = document.createElement("canvas");
  const w = 1024;
  const h = 256;
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const face = `"Familjen Grotesk", "Anybody", sans-serif`;
  let size = 104;
  g.font = `700 ${size}px ${face}`;
  while (g.measureText(text).width > w - 60 && size > 44) {
    size -= 4;
    g.font = `700 ${size}px ${face}`;
  }
  g.textBaseline = "middle";
  g.textAlign = "center";
  g.shadowColor = "rgba(0,0,0,0.65)";
  g.shadowBlur = 18;
  g.fillStyle = fg;
  g.fillText(text, w / 2, h / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Dark glass counter: blue-black terrazzo with cold flecks, so the chrome has something to reflect. */
function counterTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0a0e18";
  g.fillRect(0, 0, 512, 512);
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 7000; i++) {
    const v = 22 + r() * 40;
    g.fillStyle = `rgba(${v},${v + 8},${v + 30},${0.2 + r() * 0.5})`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2.4, 1 + r() * 2.4);
  }
  for (let i = 0; i < 6; i++) {
    g.strokeStyle = `rgba(141,160,255,${0.05 + r() * 0.06})`;
    g.lineWidth = 0.6 + r();
    g.beginPath();
    let x = r() * 512;
    let y = r() * 512;
    g.moveTo(x, y);
    for (let k = 0; k < 8; k++) g.lineTo((x += (r() - 0.5) * 120), (y += (r() - 0.3) * 60));
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type Cap = {
  kind: "q" | "a";
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: number;
  spin: number;
  scale: number;
  pair: number;
  dying: number;
};

function Bell({ ring }: { ring: React.RefObject<RingState> }) {
  const group = useRef<THREE.Group>(null);
  const domeMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [new THREE.Vector2(DOME_R + 0.05, 0), new THREE.Vector2(DOME_R + 0.045, 0.035)];
    for (let i = 0; i <= 40; i++) {
      const th = (i / 40) * (Math.PI / 2);
      pts.push(new THREE.Vector2(DOME_R * Math.cos(th) ** 0.92, 0.04 + (DOME_H - 0.04) * Math.sin(th) ** 1.08));
    }
    pts.push(new THREE.Vector2(0, DOME_H));
    const g = new THREE.LatheGeometry(pts, 96);
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame((_, dt) => {
    const r = ring.current;
    if (!r || !group.current) return;
    r.t += dt;
    const wobble = r.amp * Math.exp(-r.t * 3.2) * Math.sin(r.t * 38);
    group.current.rotation.z = wobble * 0.05;
    group.current.position.y = -Math.abs(wobble) * 0.012;
    if (domeMat.current) domeMat.current.emissiveIntensity = 0.02 + r.amp * Math.exp(-r.t * 5) * 0.9;
  });
  return (
    <group ref={group} position={[BELL_X, 0, 0]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial ref={domeMat} color={CHROME} metalness={1} roughness={0.16} clearcoat={0.5} clearcoatRoughness={0.12} envMapIntensity={1.15} emissive={COBALT} emissiveIntensity={0.02} />
      </mesh>
      <mesh position={[0, DOME_H + 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.18, 32]} />
        <meshPhysicalMaterial color={CHROME} metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, DOME_H + 0.2, 0]} scale={[1, 0.55, 1]} castShadow>
        <sphereGeometry args={[0.17, 40, 24]} />
        <meshPhysicalMaterial color={CHROME} metalness={1} roughness={0.12} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, -0.09, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.28, 1.34, 0.18, 96]} />
        <meshPhysicalMaterial color={"#05070d"} metalness={0.4} roughness={0.22} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.285, 0.014, 12, 128]} />
        <meshBasicMaterial color={COBALT} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Capsules({ ring, sound, count, clicks }: { ring: React.RefObject<RingState>; sound: boolean; count: number; clicks: React.RefObject<number> }) {
  const { viewport, size } = useThree();
  const meshes = useRef<(THREE.Group | null)[]>([]);
  const caps = useRef<Cap[]>(Array.from({ length: count }, () => ({ kind: "q", active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: 0, spin: 0, scale: 1, pair: 0, dying: 0 })));
  const [textures, setTextures] = useState<{ q: THREE.Texture[]; a: THREE.Texture[] } | null>(null);
  const spawnClock = useRef(0.6);
  const handled = useRef(0);
  const next = useRef(0);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const portrait = size.width < 760 || size.width < size.height;

  useEffect(() => {
    let alive = true;
    const make = () => {
      if (!alive) return;
      setTextures({ q: PAIRS.map(([q]) => textTexture(q, "#FFFFFF")), a: PAIRS.map(([, a]) => textTexture(a, MINT)) });
    };
    (document.fonts?.ready ?? Promise.resolve()).then(make);
    return () => {
      alive = false;
    };
  }, []);

  function spawn(kind: "q" | "a", pair: number, at?: THREE.Vector3, fast = false) {
    const c = caps.current.find((x) => !x.active);
    if (!c) return;
    c.active = true;
    c.kind = kind;
    c.pair = pair;
    c.dying = 0;
    c.scale = kind === "a" ? 0.3 : 1;
    if (kind === "q") {
      c.pos.set(BELL_X + (Math.random() - 0.5) * 0.7, 3.05 + Math.random() * 0.2, (Math.random() - 0.5) * 0.4);
      c.vel.set((Math.random() - 0.5) * 0.1, fast ? -2.8 : -0.35, 0);
      c.rot = (Math.random() - 0.5) * 0.7;
      c.spin = (Math.random() - 0.5) * 1.2;
    } else {
      c.pos.copy(at ?? new THREE.Vector3(BELL_X, DOME_H + 0.4, 0));
      // Landscape: answers fly left across the page. Portrait: they rise and drift off the top.
      if (portrait) c.vel.set((Math.random() - 0.5) * 1.6, 1.1 + Math.random() * 0.5, 0.3);
      else c.vel.set(-2.1 - Math.random() * 0.6, 0.55 + Math.random() * 0.35, 0.25);
      c.rot = 0;
      c.spin = 0.3 + Math.random() * 0.4;
    }
  }

  useFrame((_, rawDt) => {
    if (!textures) return;
    const dt = Math.min(rawDt, 1 / 30);
    // A click on the bell sends a question down from the top right away; it rings the bell when it lands.
    while (handled.current < (clicks.current ?? 0)) {
      handled.current++;
      spawn("q", next.current++ % PAIRS.length, undefined, true);
      spawnClock.current = Math.max(spawnClock.current, 1.9);
    }
    spawnClock.current -= dt;
    if (spawnClock.current <= 0) {
      spawn("q", next.current++ % PAIRS.length);
      spawnClock.current = 1.7 + Math.random() * 0.9;
    }
    caps.current.forEach((c, i) => {
      const m = meshes.current[i];
      if (!m) return;
      if (!c.active) {
        m.visible = false;
        return;
      }
      m.visible = true;
      if (c.dying > 0) {
        c.dying += dt;
        c.scale = Math.max(0, 1 - c.dying * 7);
        if (c.scale <= 0) c.active = false;
      } else if (c.kind === "q") {
        c.vel.y -= 1.7 * dt;
        c.pos.addScaledVector(c.vel, dt);
        c.rot += c.spin * dt;
        // Strike: the words meet the bell, it rings, and the same line turns into its answer and flies off.
        if (c.pos.y - 0.2 <= DOME_H + 0.3 && Math.abs(c.pos.x - BELL_X) < 0.95) {
          const r = ring.current!;
          r.t = 0;
          r.amp = Math.min(1.4, 0.7 + Math.abs(c.vel.y) * 0.12);
          if (soundRef.current) ding(0.35);
          c.kind = "a";
          c.scale = 0.9;
          c.pos.set(BELL_X + 0.1, DOME_H + 0.55, 0.2);
          if (portrait) c.vel.set((Math.random() - 0.5) * 1.6, 1.1 + Math.random() * 0.5, 0.3);
          else c.vel.set(-2.1 - Math.random() * 0.6, 0.55 + Math.random() * 0.35, 0.25);
          c.rot = 0;
          c.spin = 0.3 + Math.random() * 0.4;
        }
        if (c.pos.y < -2) c.active = false;
      } else {
        c.scale = Math.min(1, c.scale + dt * 3);
        c.vel.y -= 0.12 * dt;
        c.pos.addScaledVector(c.vel, dt);
        c.rot += c.spin * dt * 0.15;
        if (c.pos.x < -viewport.width / 2 - 3 || c.pos.y > 7) c.active = false;
      }
      m.position.copy(c.pos);
      m.rotation.set(0, 0, c.rot);
      m.scale.setScalar(c.scale);
      const q = m.children[0] as THREE.Mesh;
      const mat = q.material as THREE.MeshBasicMaterial;
      const tex = c.kind === "q" ? textures.q[c.pair] : textures.a[c.pair];
      if (mat.map !== tex) {
        mat.map = tex;
        mat.needsUpdate = true;
      }
    });
  });

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} ref={(el) => void (meshes.current[i] = el)} visible={false}>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[2.6, 0.65]} />
            <meshBasicMaterial transparent toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Counter() {
  const tex = useMemo(() => counterTexture(), []);
  return (
    <mesh position={[0, -0.38, 0]} receiveShadow>
      <boxGeometry args={[60, 0.4, 40]} />
      <meshStandardMaterial map={tex} roughness={0.92} metalness={0} color={"#363e58"} />
    </mesh>
  );
}

/** Wide screens: bell on the right, camera drifting with the pointer. Narrow screens: bell centred in the upper part, above the headline. */
function Rig() {
  const { camera, pointer, size } = useThree();
  useFrame(() => {
    const compact = size.width < 760 || size.width < size.height;
    const tx = compact ? BELL_X + pointer.x * 0.25 : pointer.x * 0.35;
    const ty = (compact ? 2.1 : 2.3) + pointer.y * 0.15;
    const tz = compact ? 10.6 : 7.6;
    camera.position.x += (tx - camera.position.x) * 0.04;
    camera.position.y += (ty - camera.position.y) * 0.04;
    camera.position.z += (tz - camera.position.z) * 0.04;
    if (compact) camera.lookAt(BELL_X, -0.95, 0);
    else camera.lookAt(1.15, 0.12, 0);
  });
  return null;
}

/** Tells the loading screen the bell has really been drawn (shaders compiled, a few frames out). */
function ReadyAfter({ frames, onReady }: { frames: number; onReady?: () => void }) {
  const seen = useRef(0);
  useFrame(() => {
    if (seen.current < frames && ++seen.current === frames) onReady?.();
  });
  return null;
}

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode; onFail?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** `lite` is for phones and weak GPUs: no shadows, no post-processing, fewer capsules, lower pixel ratio. */
export default function HeroCanvas({ sound, onReady, active, lite = false }: { sound: boolean; onReady?: () => void; active: boolean; lite?: boolean }) {
  const ring = useRef<RingState>({ t: 10, amp: 0 });
  const clicks = useRef(0);
  // ?fx=low also skips shadows and post-processing (slow GPUs, headless capture).
  const [lowFx] = useState(() => lite || (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("fx") === "low"));
  return (
    <Boundary onFail={onReady} fallback={<StaticBell className="absolute right-[-10%] top-[8%] w-[120%] max-w-[760px] sm:right-0 sm:w-[70%]" />}>
      <Canvas
        shadows={!lowFx}
        dpr={lite ? [1, 1.5] : [1, 1.75]}
        frameloop={active ? "always" : "never"}
        gl={{ antialias: !lite, powerPreference: lite ? "default" : "high-performance", alpha: false }}
        camera={{ position: [0, 2.3, 7.6], fov: 34 }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          scene.background = new THREE.Color(INK);
          scene.fog = new THREE.Fog(INK, 8, 18);
        }}
        onPointerDown={() => {
          clicks.current += 1;
          ring.current.t = 0;
          ring.current.amp = 0.3;
        }}
      >
        <ReadyAfter frames={4} onReady={onReady} />
        <ambientLight intensity={0.08} />
        <spotLight position={[-0.6, 6.5, 3.2]} angle={0.42} penumbra={0.85} intensity={190} decay={2} distance={20} color={"#dbe6ff"} castShadow={!lowFx} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} target-position={[BELL_X, 0, 0]} />
        <pointLight position={[BELL_X + 2.5, 1.4, 2.5]} intensity={5} color={COBALT} />
        <pointLight position={[BELL_X - 2.6, 1.2, -1.8]} intensity={3.2} color={"#ff4da6"} />
        <Environment resolution={512} frames={1}>
          {/* A small studio: a big soft box overhead, two coloured strips at the sides, a cool floor bounce. The chrome only looks like chrome if it has something bright to reflect. */}
          <Lightformer form="rect" intensity={6} color="#eef3ff" position={[0, 7, 1]} scale={[16, 7, 1]} rotation={[Math.PI / 2, 0, 0]} />
          <Lightformer form="rect" intensity={4} color="#b9c8ff" position={[-7, 2, 3]} scale={[2.4, 9, 1]} rotation={[0, Math.PI / 2.4, 0]} />
          <Lightformer form="rect" intensity={3.2} color="#7ff5d6" position={[7, 1.5, -1]} scale={[2, 7, 1]} rotation={[0, -Math.PI / 2.4, 0]} />
          <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, 2, -8]} scale={[12, 3, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#3f5bff" position={[0, -5, 0]} scale={[16, 8, 1]} rotation={[-Math.PI / 2, 0, 0]} />
        </Environment>
        <Counter />
        <Bell ring={ring} />
        <Capsules ring={ring} sound={sound} count={lite ? 8 : 12} clicks={clicks} />
        <Rig />
        {lowFx ? null : (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.8} luminanceSmoothing={0.2} />
            <Noise opacity={0.05} premultiply />
            <Vignette offset={0.28} darkness={0.72} />
          </EffectComposer>
        )}
      </Canvas>
    </Boundary>
  );
}
