import { NextResponse } from "next/server";
import { sql } from "@/db";
import { env } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { safeEqual } from "@/lib/crypto";
import { getProviders, probeProviders } from "@/agent/ai-router";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** ?test=ai calls every provider, so only a signed-in owner (or Bearer $CRON_SECRET) may run it. */
async function mayTestAI(req: Request) {
  const s = await getSession();
  if (s?.role === "owner") return true;
  return Boolean(env.cronSecret) && safeEqual(req.headers.get("authorization") ?? "", `Bearer ${env.cronSecret}`);
}

export async function GET(req: Request) {
  const testAI = new URL(req.url).searchParams.get("test") === "ai";

  try {
    // 1. Test database ping
    const ping = await sql`SELECT 1 as alive`;

    // 2. Count workspaces and users
    let workspacesCount = 0;
    let usersCount = 0;
    try {
      const [wsRes] = await sql`SELECT count(*)::int as n FROM workspaces`;
      workspacesCount = wsRes?.n ?? 0;
      const [userRes] = await sql`SELECT count(*)::int as n FROM users`;
      usersCount = userRes?.n ?? 0;
    } catch {
      // Tables might not exist yet
    }

    let aiDiagnostics: Record<string, unknown> | string | undefined = undefined;
    if (testAI) aiDiagnostics = (await mayTestAI(req)) ? await probeProviders() : "Sign in as an owner to run the AI test.";

    return NextResponse.json({
      status: "ok",
      database: {
        connected: Boolean(ping && ping.length > 0),
        workspaces: workspacesCount,
        users: usersCount,
        seeded: usersCount > 0,
      },
      ai: {
        configured: env.hasAnthropic,
        providers: getProviders().map((p) => p.name),
        diagnostics: aiDiagnostics,
      },
      environment: {
        demoMode: env.demoMode,
        demoWorkspaceId: env.demoWorkspaceId,
        appUrl: env.appUrl,
      },
    });
  } catch (error: any) {
    console.error("[health] failed", error);
    return NextResponse.json(
      {
        status: "error",
        database: { connected: false },
        ai: {
          configured: env.hasAnthropic,
          providers: getProviders().map((p) => p.name),
        },
      },
      { status: 500 }
    );
  }
}
