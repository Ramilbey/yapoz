"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ding } from "./sound";

const BRASS = new THREE.Color("#C8A048");
const PAPER = "#F2ECE0";
const INK = "#0E0D0B";
const ANSWERED = "#D4FF3A";

const PAIRS: [string, string][] = [
  ["haircut tmr 3pm?", "Booked: Thu 3pm with Amanda"],
  ["large margherita how much", "RM 52, ready in 15 min"],
  ["got size M in red?", "Red M: 3 left"],
  ["open on monday?", "Closed Mondays, sorry"],
  ["room for 2 this sat?", "1 Deluxe left, RM 260"],
  ["deliver to mont kiara?", "Yes: RM 9, about 45 min"],
  ["iphone 13 screen how much", "RM 380, done in 1 hour"],
  ["table for 4 fri 8pm?", "Booked: Fri 8pm, 4 people"],
  ["u guys halal ah?", "Halal-certified kitchen"],
];

const BELL_X = 3.0;
const DOME_H = 0.95;
const DOME_R = 1.0;

function textTexture(text: string, fg: string, bg: string) {
  const c = document.createElement("canvas");
  const w = 1024;
  const h = 256;
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(4, 4, w - 8, h - 8, (h - 8) / 2);
  g.fill();
  g.fillStyle = fg;
  g.font = `500 76px "General Sans", "Bricolage Grotesque Variable", sans-serif`;
  g.textBaseline = "middle";
  g.textAlign = "center";
  let size = 76;
  while (g.measureText(text).width > w - 140 && size > 40) {
    size -= 4;
    g.font = `500 ${size}px "General Sans", "Bricolage Grotesque Variable", sans-serif`;
  }
  g.fillText(text, w / 2, h / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function stoneTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#17150f";
  g.fillRect(0, 0, 512, 512);
  // Speckled granite, deterministic.
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 9000; i++) {
    const v = 18 + r() * 34;
    g.fillStyle = `rgba(${v + 8},${v + 4},${v},${0.25 + r() * 0.5})`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2.2, 1 + r() * 2.2);
  }
  for (let i = 0; i < 7; i++) {
    g.strokeStyle = `rgba(138,132,122,${0.04 + r() * 0.05})`;
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

function Bell({ ring }: { ring: React.RefObject<{ t: number; amp: number }> }) {
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
    if (domeMat.current) domeMat.current.emissiveIntensity = 0.02 + r.amp * Math.exp(-r.t * 5) * 0.55;
  });
  return (
    <group ref={group} position={[BELL_X, 0, 0]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial ref={domeMat} color={BRASS} metalness={1} roughness={0.24} clearcoat={0.4} clearcoatRoughness={0.25} emissive={"#7a5a18"} emissiveIntensity={0.02} />
      </mesh>
      <mesh position={[0, DOME_H + 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.18, 32]} />
        <meshPhysicalMaterial color={BRASS} metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[0, DOME_H + 0.2, 0]} scale={[1, 0.55, 1]} castShadow>
        <sphereGeometry args={[0.17, 40, 24]} />
        <meshPhysicalMaterial color={BRASS} metalness={1} roughness={0.2} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, -0.09, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.28, 1.34, 0.18, 96]} />
        <meshPhysicalMaterial color={"#0b0a08"} metalness={0.2} roughness={0.35} clearcoat={0.8} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.285, 0.012, 12, 128]} />
        <meshPhysicalMaterial color={BRASS} metalness={1} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Capsules({ ring, sound }: { ring: React.RefObject<{ t: number; amp: number }>; sound: boolean }) {
  const N = 12;
  const { viewport } = useThree();
  const meshes = useRef<(THREE.Group | null)[]>([]);
  const caps = useRef<Cap[]>(Array.from({ length: N }, () => ({ kind: "q", active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: 0, spin: 0, scale: 1, pair: 0, dying: 0 })));
  const [textures, setTextures] = useState<{ q: THREE.Texture[]; a: THREE.Texture[] } | null>(null);
  const spawnClock = useRef(0.6);
  const next = useRef(0);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    let alive = true;
    const make = () => {
      if (!alive) return;
      setTextures({ q: PAIRS.map(([q]) => textTexture(q, INK, "rgba(242,236,224,0.94)")), a: PAIRS.map(([, a]) => textTexture(a, INK, ANSWERED)) });
    };
    (document.fonts?.ready ?? Promise.resolve()).then(make);
    return () => {
      alive = false;
    };
  }, []);

  function spawn(kind: "q" | "a", pair: number, at?: THREE.Vector3) {
    const c = caps.current.find((x) => !x.active);
    if (!c) return;
    c.active = true;
    c.kind = kind;
    c.pair = pair;
    c.dying = 0;
    c.scale = kind === "a" ? 0.3 : 1;
    if (kind === "q") {
      c.pos.set(BELL_X + (Math.random() - 0.5) * 0.7, 3.05 + Math.random() * 0.2, (Math.random() - 0.5) * 0.4);
      c.vel.set((Math.random() - 0.5) * 0.1, -0.35, 0);
      c.rot = (Math.random() - 0.5) * 0.7;
      c.spin = (Math.random() - 0.5) * 1.2;
    } else {
      c.pos.copy(at ?? new THREE.Vector3(BELL_X, DOME_H + 0.4, 0));
      c.vel.set(-2.1 - Math.random() * 0.6, 0.55 + Math.random() * 0.35, 0.25);
      c.rot = 0;
      c.spin = 0.3 + Math.random() * 0.4;
    }
  }

  useFrame((_, rawDt) => {
    if (!textures) return;
    const dt = Math.min(rawDt, 1 / 30);
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
        // Strike: the capsule's bottom meets the bell's top.
        if (c.pos.y - 0.24 <= DOME_H + 0.3 && Math.abs(c.pos.x - BELL_X) < 0.95) {
          c.dying = 0.0001;
          const r = ring.current!;
          r.t = 0;
          r.amp = Math.min(1.4, 0.7 + Math.abs(c.vel.y) * 0.12);
          if (soundRef.current) ding(0.35);
          spawn("a", c.pair, new THREE.Vector3(BELL_X + 0.1, DOME_H + 0.55, 0.2));
        }
        if (c.pos.y < -2) c.active = false;
      } else {
        c.scale = Math.min(1, c.scale + dt * 4);
        c.vel.y -= 0.12 * dt;
        c.pos.addScaledVector(c.vel, dt);
        c.rot += c.spin * dt * 0.15;
        if (c.pos.x < -viewport.width / 2 - 3 || c.pos.y > 6) c.active = false;
      }
      m.position.copy(c.pos);
      m.rotation.set(0, 0, c.rot);
      m.scale.setScalar(c.scale);
      const q = m.children[1] as THREE.Mesh;
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
      {Array.from({ length: N }, (_, i) => (
        <group key={i} ref={(el) => void (meshes.current[i] = el)} visible={false}>
          <RoundedBox args={[1.9, 0.48, 0.16]} radius={0.08} smoothness={4} castShadow>
            <meshPhysicalMaterial color={PAPER} roughness={0.35} transmission={0} transparent opacity={0.28} />
          </RoundedBox>
          <mesh position={[0, 0, 0.085]}>
            <planeGeometry args={[1.9, 0.475]} />
            <meshBasicMaterial transparent toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Counter() {
  const tex = useMemo(() => stoneTexture(), []);
  return (
    <mesh position={[0, -0.38, 0]} receiveShadow>
      <boxGeometry args={[60, 0.4, 40]} />
      <meshStandardMaterial map={tex} roughness={0.86} metalness={0.05} color={"#9b958a"} />
    </mesh>
  );
}

function Rig() {
  const { camera, pointer } = useThree();
  useFrame(() => {
    camera.position.x += (pointer.x * 0.35 - camera.position.x) * 0.03;
    camera.position.y += (2.3 + pointer.y * 0.15 - camera.position.y) * 0.03;
    camera.lookAt(1.15, 0.12, 0);
  });
  return null;
}

export default function HeroCanvas({ sound, onReady, active }: { sound: boolean; onReady?: () => void; active: boolean }) {
  const ring = useRef({ t: 10, amp: 0 });
  // ?fx=low skips shadows and post-processing (slow GPUs, headless capture).
  const [lowFx] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("fx") === "low");
  return (
    <Canvas
      shadows={!lowFx}
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 2.3, 7.6], fov: 34 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.background = new THREE.Color("#0E0D0B");
        scene.fog = new THREE.Fog("#0E0D0B", 8, 17);
        onReady?.();
      }}
      onPointerDown={() => {
        ring.current.t = 0;
        ring.current.amp = 1.2;
        if (sound) ding(0.5);
      }}
    >
      <ambientLight intensity={0.06} />
      <spotLight position={[-0.6, 6.5, 3.2]} angle={0.42} penumbra={0.85} intensity={180} decay={2} distance={20} color={"#ffd49a"} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} target-position={[BELL_X, 0, 0]} />
      <pointLight position={[BELL_X + 2.5, 1.4, 2.5]} intensity={2.2} color={"#ffb766"} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.6} color="#ffdcae" position={[-3, 4, 3]} scale={[6, 1.5, 1]} rotation={[-0.6, 0.4, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#ffb766" position={[4, 2, 2]} scale={[2, 4, 1]} rotation={[0, -0.8, 0]} />
        <Lightformer form="ring" intensity={0.7} color="#ffe8c7" position={[0, 5, -4]} scale={3} />
      </Environment>
      <Counter />
      <Bell ring={ring} />
      <Capsules ring={ring} sound={sound} />
      <Rig />
      {lowFx ? null : (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.82} luminanceSmoothing={0.2} />
          <Noise opacity={0.055} premultiply />
          <Vignette offset={0.28} darkness={0.72} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
