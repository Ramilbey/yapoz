"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { cx } from "../ui/cx";

type Toast = { id: number; text: string; tone: "info" | "error" | "ok" };
const Ctx = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-3), { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), tone === "error" ? 7000 : 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              "row-new pointer-events-auto rounded-xl border bg-panel px-4 py-3 text-[14px] text-fg shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]",
              t.tone === "error" ? "border-accent/60" : "border-line-strong",
            )}
          >
            {t.tone === "error" ? <span className="mr-2 font-medium text-signal-ink">Couldn&apos;t do that.</span> : null}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
