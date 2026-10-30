import { z } from "zod";
import { handle, getSession } from "@/lib/auth";
import { body, clientIp, ok } from "@/lib/api";
import { hit } from "@/lib/ratelimit";
import { ingest, respond } from "@/agent/pipeline";
import { env } from "@/lib/env";
import { simulatorWorkspace } from "@/lib/samples";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/),
  text: z.string().trim().min(1).max(500),
  accent: z.enum(["telegram", "whatsapp"]).default("telegram"),
  name: z.string().trim().max(40).optional(),
  /** A sample business on the public site. Signed-in users without it talk to their own business. */
  workspace: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,12}$/).optional(),
});

/** The built-in Simulator: same pipeline as every channel, channel = "simulator". */
export const POST = handle(async (req: Request) => {
  const b = await body(req, Body);
  const session = await getSession();
  const workspaceId = await simulatorWorkspace(b.workspace, session?.workspaceId ?? null);
  if (!workspaceId) return ok({ error: "That business isn't available in the simulator." }, { status: 404 });
  if (!session) {
    const ip = clientIp(req);
    for (const [key, win, limit] of [
      [`sim:ip:${ip}:m`, "minute", 8],
      [`sim:ip:${ip}:d`, "day", 80],
      [`sim:session:${b.sessionId}:d`, "day", 40],
      [`sim:global:h`, "hour", 900],
    ] as const) {
      const r = await hit(key, win, limit);
      if (!r.ok) return ok({ error: win === "minute" ? "You're typing faster than we can answer. Try again in a minute." : "The live demo has hit its limit for now. Try again later." }, { status: 429 });
    }
  }
  const r = await ingest({
    workspaceId, channel: "simulator", externalThreadId: `sim:${b.sessionId}`,
    customer: { externalId: b.sessionId, displayName: b.name || (session ? `${session.name} (test)` : "Web visitor") },
    text: b.text, attachments: [], receivedAt: new Date(), accent: b.accent, routing: { accent: b.accent },
  });
  const out = await respond(r.thread.id, r.messageId);
  return ok({
    threadId: r.thread.id,
    reply: out.reply ?? null,
    skipped: out.skipped ?? null,
    status: out.status ?? null,
    outcome: out.outcome ?? null,
    tools: (out.tools ?? []).map((tc) => ({ name: tc.name, label: tc.label, ok: tc.ok, ms: tc.ms })),
    // Staff-written summaries (and AI error details) stay inside the signed-in desks; the public site only gets the category.
    escalated: (out.escalated ?? []).map((e) => (session ? e : { category: e.category })),
    order: out.order ?? null,
    latencyMs: out.latencyMs ?? null,
    model: out.model ?? null,
    aiConfigured: env.hasAnthropic,
  });
});
