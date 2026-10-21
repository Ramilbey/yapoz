"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { send } from "./fetcher";

export function EnableHiring() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="brass"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        await send("/api/workspace", "PATCH", { modules: { hiring: true } }).catch(() => {});
        router.refresh();
      }}
    >
      Turn on hiring
    </Button>
  );
}
