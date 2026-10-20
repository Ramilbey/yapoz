"use client";
import * as D from "@radix-ui/react-dialog";

export function Dialog({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; description?: string; children: React.ReactNode }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-[2px]" />
        <D.Content className="fixed left-1/2 top-[12vh] z-50 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-line bg-panel p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]">
          <D.Title className="font-display text-[22px] font-bold leading-tight">{title}</D.Title>
          {description ? <D.Description className="mt-1 text-[14px] text-muted">{description}</D.Description> : null}
          <div className="mt-5">{children}</div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
