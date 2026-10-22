"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

export type LiveEvent = { t: string; op?: string; id?: string | null; thread?: string | null; demo?: boolean };
type Sub = (e: LiveEvent) => void;
type Ctx = { subscribe: (fn: Sub) => () => void; connected: boolean };

const LiveCtx = createContext<Ctx>({ subscribe: () => () => {}, connected: false });

/** One EventSource per tab. Falls back to polling ticks when the stream is down. */
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const subs = useRef(new Set<Sub>());
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let closed = false;
    const emit = (e: LiveEvent) => subs.current.forEach((s) => s(e));
    const startPoll = () => {
      if (!poll) poll = setInterval(() => emit({ t: "poll" }), 5000);
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
    return () => {
      closed = true;
      es?.close();
      stopPoll();
    };
  }, []);
  return (
    <LiveCtx.Provider value={{ subscribe: (fn) => (subs.current.add(fn), () => subs.current.delete(fn)), connected }}>
      {children}
    </LiveCtx.Provider>
  );
}

export const useLiveStatus = () => useContext(LiveCtx).connected;

/** Call `onChange` (debounced) whenever a change on one of `tables` arrives. */
export function useLive(tables: string[] | "all", onChange: (e: LiveEvent) => void, delay = 250) {
  const { subscribe } = useContext(LiveCtx);
  const cb = useRef(onChange);
  cb.current = onChange;
  const key = tables === "all" ? "all" : tables.join(",");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let last: LiveEvent | null = null;
    const list = key === "all" ? null : key.split(",");
    return subscribe((e) => {
      if (e.t !== "poll" && list && !list.includes(e.t)) return;
      last = e;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => last && cb.current(last), delay);
    });
  }, [key, subscribe, delay]);
}
