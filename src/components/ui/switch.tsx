"use client";
import * as S from "@radix-ui/react-switch";
import { cx } from "./cx";

export function Switch({ checked, onCheckedChange, label, disabled, id }: { checked: boolean; onCheckedChange: (v: boolean) => void; label?: string; disabled?: boolean; id?: string }) {
  return (
    <S.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className={cx("relative h-[22px] w-[38px] shrink-0 rounded-full border border-line-strong transition-colors disabled:opacity-50", checked ? "bg-brass border-brass" : "bg-raised")}
    >
      <S.Thumb className={cx("block h-4 w-4 rounded-full transition-transform duration-200", checked ? "translate-x-[18px] bg-ink" : "translate-x-[2px] bg-muted")} />
    </S.Root>
  );
}
