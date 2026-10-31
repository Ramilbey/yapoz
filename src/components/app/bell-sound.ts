"use client";
// The counter bell you tap at a till: one bright strike that dies away by itself. It never loops. A new order is one tap;
// a customer waiting on a person is two. Synthesized, so there are no audio files.
let ctx: AudioContext | null = null;

const audio = () => (ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());

const STRIKE_GAP = 0.2;
// Frequency, loudness, seconds to fade: a small brass dome rings high, and its overtones fade first. The two nearly equal
// notes give the slight shimmer of real metal.
const PARTIALS = [[2480, 1, 1.5], [2487, 0.5, 1.3], [5620, 0.34, 0.6], [8350, 0.16, 0.25], [1240, 0.08, 0.4]] as const;

function strike(c: AudioContext, at: number, out: AudioNode) {
  for (const [freq, amp, decay] of PARTIALS) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(amp, at + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + decay + 0.02);
  }
  // The tap itself: a few milliseconds of noise, the clapper hitting the dome.
  const tap = c.createBuffer(1, Math.ceil(c.sampleRate * 0.006), c.sampleRate);
  const d = tap.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = tap;
  g.gain.value = 0.25;
  src.connect(g).connect(out);
  src.start(at);
}

/** Browsers only allow sound after a click on the page: call this from one. */
export function unlockBell() {
  try {
    void audio().resume();
  } catch {
    /* audio unavailable */
  }
}

export function ringBell(kind: "order" | "needs", volume: number) {
  try {
    const c = audio();
    void c.resume();
    const master = c.createGain();
    master.gain.value = volume * 0.45;
    master.connect(c.destination);
    const at = c.currentTime + 0.01;
    strike(c, at, master);
    if (kind === "needs") strike(c, at + STRIKE_GAP, master);
  } catch {
    /* audio unavailable */
  }
}
