"use client";
import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="max-w-[56ch] border-t border-line pt-8">
      <h1 className="font-display text-[28px] font-bold">This page didn&apos;t load.</h1>
      <p className="mt-2 text-[15px] text-muted">{error.message || "The server returned an error."} Check that the database is reachable, then try again.</p>
      <button onClick={reset} className="mt-5 h-10 rounded-[10px] bg-signal px-4 text-sm font-medium text-ink">Try again</button>
    </div>
  );
}
