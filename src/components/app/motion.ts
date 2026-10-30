"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Counts up to `value` and eases out. A later change (a live update) counts on from where the number is, not from zero.
 * Under prefers-reduced-motion it returns `value` straight away. `null` stays `null`.
 */
export function useCountUp(value: number | null, ms = 1400): number | null {
  const [shown, setShown] = useState(0);
  const cur = useRef(0);
  useEffect(() => {
    if (value === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cur.current = value;
      setShown(value);
      return;
    }
    const from = cur.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      cur.current = from + (value - from) * (1 - Math.pow(1 - p, 4));
      setShown(cur.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return value === null ? null : shown;
}
