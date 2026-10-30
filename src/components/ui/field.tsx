"use client";
import { forwardRef } from "react";
import { cx } from "./cx";

const base = "w-full rounded-[10px] border border-line bg-raised px-3 text-[14px] text-fg placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/25";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cx(base, "h-10", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cx(base, "py-2.5 leading-relaxed resize-y", className)} {...p} />;
});

export function Label({ children, hint, htmlFor }: { children: React.ReactNode; hint?: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px] text-fg-2">
      <span>{children}</span>
      {hint ? <span className="text-muted">{hint}</span> : null}
    </label>
  );
}
