"use client";
import * as D from "@radix-ui/react-dialog";

export function Dialog({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; description?: string; children: React.ReactNode }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-bg/70 backdrop-blur-[6px]" />
        <D.Content className="fixed left-1/2 top-[12vh] z-50 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-line-strong bg-panel p-6 shadow-yp-dialog [animation:k-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          <D.Title className="font-display text-[22px] font-bold leading-tight">{title}</D.Title>
          {description ? <D.Description className="mt-1 text-[14px] text-muted">{description}</D.Description> : null}
          <div className="mt-5">{children}</div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
