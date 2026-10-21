"use client";
import { useState } from "react";
import { cx } from "./cx";

/** A value shown in mono with a copy button (webhook URLs, invite links, tokens to paste elsewhere). */
export function CopyField({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className={cx("flex min-w-0 items-stretch overflow-hidden rounded-[10px] border border-line bg-raised", className)}>
      <code className="num min-w-0 flex-1 truncate px-3 py-2 text-[12.5px] text-fg-2" title={value} aria-label={label}>
        {value}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          } catch {}
        }}
        className="shrink-0 border-l border-line px-3 text-[12px] font-medium text-fg-2 hover:bg-panel hover:text-fg"
      >
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
