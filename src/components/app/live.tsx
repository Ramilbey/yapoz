"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

export type LiveEvent = { t: string; op?: string; id?: string | null; thread?: string | null; demo?: boolean };
type Sub = (e: LiveEvent) => void;
type Ctx = { subscribe: (fn: Sub) => () => void; connected: boolean };

const LiveCtx = createContext<Ctx>({ subscribe: () => () => {}, connected: false });

/**
 * One EventSource per tab. Falls back to polling ticks when the stream is down, only while the tab is visible:
 * a background tab refetching every few seconds is wasted load on the server and the database.
 */
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const subs = useRef(new Set<Sub>());
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let closed = false;
    const emit = (e: LiveEvent) => subs.current.forEach((s) => s(e));
    const startPoll = () => {
      if (!poll) poll = setInterval(() => document.visibilityState === "visible" && emit({ t: "poll" }), 8000);
    };
    const stopPoll = () => {
      if (poll) clearInterval(poll);
      poll = null;
    };
    const open = () => {
      es = new EventSource("/api/stream");
      // An open stream isn't proof that changes arrive (LISTEN through a transaction pooler stays silent),
      // so keep polling until the first real change comes through it.
      startPoll();
      es.onopen = () => setConnected(true);
      es.onmessage = (m) => {
        try {
          const e = JSON.parse(m.data) as LiveEvent;
          if (e.t !== "hello") stopPoll();
          emit(e);
        } catch {}
      };
      es.onerror = () => {
        setConnected(false);
        startPoll();
        if (es?.readyState === EventSource.CLOSED && !closed) setTimeout(open, 3000);
      };
    };
    open();
    // Coming back to the tab: catch up once instead of having polled all along.
    const onVisible = () => document.visibilityState === "visible" && emit({ t: "poll" });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      closed = true;
      es?.close();
      stopPoll();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return (
    <LiveCtx.Provider value={{ subscribe: (fn) => (subs.current.add(fn), () => subs.current.delete(fn)), connected }}>
      {children}
    </LiveCtx.Provider>
  );
}

export const useLiveStatus = () => useContext(LiveCtx).connected;

/**
 * Call `onChange` whenever a change on one of `tables` arrives, at most once per `delay` ms. One AI reply touches several
 * rows (message, thread, run, escalation) in a burst: they collapse into one refetch. Unlike a plain debounce, a steady
 * stream of changes still refreshes on time instead of being pushed back forever.
 */
export function useLive(tables: string[] | "all", onChange: (e: LiveEvent) => void, delay = 250, accept?: (e: LiveEvent) => boolean) {
  const { subscribe } = useContext(LiveCtx);
  const cb = useRef(onChange);
  // Filtering happens per event, before the burst collapses, so a matching change is never masked by a later unrelated one.
  const ok = useRef(accept);
  useEffect(() => {
    cb.current = onChange;
    ok.current = accept;
  });
  const key = tables === "all" ? "all" : tables.join(",");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let last: LiveEvent | null = null;
    const list = key === "all" ? null : key.split(",");
    const unsub = subscribe((e) => {
      if (e.t !== "poll" && list && !list.includes(e.t)) return;
      if (e.t !== "poll" && ok.current && !ok.current(e)) return;
      last = e;
      if (!timer)
        timer = setTimeout(() => {
          timer = null;
          if (last) cb.current(last);
        }, delay);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [key, subscribe, delay]);
}
