"use client";
// A synthesized service-bell "ding": inharmonic partials with exponential decay. No audio files.
let ctx: AudioContext | null = null;
let last = 0;

export function ding(volume = 0.4) {
  if (typeof window === "undefined") return;
  const now = performance.now();
  if (now - last < 120) return;
  last = now;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    const base = 1720;
    for (const [ratio, amp, decay] of [[1, 1, 1.6], [2.32, 0.42, 0.9], [4.25, 0.18, 0.5], [6.8, 0.08, 0.3], [0.5, 0.12, 1.2]] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = base * ratio;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + decay + 0.05);
    }
  } catch {
    /* audio unavailable */
  }
}
