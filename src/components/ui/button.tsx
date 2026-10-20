"use client";
import { forwardRef } from "react";
import { cx } from "./cx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "brass";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-signal text-ink hover:brightness-110 active:brightness-95",
  brass: "bg-brass text-ink hover:brightness-105 active:brightness-95",
  secondary: "border border-line-strong text-fg hover:bg-raised",
  ghost: "text-fg-2 hover:text-fg hover:bg-raised",
  danger: "border border-line-strong text-signal-ink hover:bg-raised",
};
const sizes: Record<Size, string> = { sm: "h-8 px-3 text-[13px] gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-12 px-6 text-[15px] gap-2" };

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }>(
  function Button({ variant = "secondary", size = "md", loading, className, children, disabled, ...rest }, ref) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cx(
          "inline-flex items-center justify-center rounded-[10px] font-medium transition-[filter,background-color,color] duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
          variants[variant],
          sizes[size],
          className,
        )}
        {...rest}
      >
        {loading ? <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  },
);
