import { handle, getSession } from "@/lib/auth";
import { ok } from "@/lib/api";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { seedWorkspace } from "@/seed/run";

export const maxDuration = 120;

/** Restore the seeded Forno Sette state. Owner session, or Authorization: Bearer $DEMO_RESET_TOKEN. */
export const POST = handle(async (req: Request) => {
  if (!env.demoMode) return ok({ error: "Demo mode is off" }, { status: 403 });
  const token = process.env.DEMO_RESET_TOKEN;
  const auth = req.headers.get("authorization") ?? "";
  const s = await getSession();
  const allowed = (s?.role === "owner" && s.workspaceId === env.demoWorkspaceId) || (token && safeEqual(auth, `Bearer ${token}`));
  if (!allowed) return ok({ error: "Owner only" }, { status: 403 });
  const started = Date.now();
  await seedWorkspace({ withHistory: true });
  return ok({ ok: true, ms: Date.now() - started, note: "Workspace re-seeded. Sign in again." });
});
