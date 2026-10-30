"use client";
import { useEffect, useRef } from "react";
import Script from "next/script";

type TurnstileApi = {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
};
const api = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

/** Cloudflare's human check. Tokens are single-use: bump `resetKey` to get a fresh one after a failed submit. */
export function Turnstile({ siteKey, onToken, resetKey }: { siteKey: string; onToken: (token: string) => void; resetKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  function mount() {
    if (!box.current || widget.current !== null) return;
    widget.current =
      api()?.render(box.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      }) ?? null;
  }

  useEffect(() => {
    mount();
    return () => {
      if (widget.current !== null) api()?.remove(widget.current);
      widget.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  useEffect(() => {
    if (resetKey > 0 && widget.current !== null) api()?.reset(widget.current);
  }, [resetKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mount} />
      <div ref={box} className="min-h-[65px]" />
    </>
  );
}
