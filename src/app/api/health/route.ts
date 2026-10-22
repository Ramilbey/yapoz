import { NextResponse } from "next/server";
import { db, t, sql } from "@/db";
import { env } from "@/lib/env";
import { getProviders } from "@/agent/ai-router";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const aiProviders = getProviders().map((p) => p.name);

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
        providers: aiProviders,
      },
      environment: {
        demoMode: env.demoMode,
        demoWorkspaceId: env.demoWorkspaceId,
        appUrl: env.appUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        database: {
          connected: false,
          error: error.message || String(error),
        },
        ai: {
          configured: env.hasAnthropic,
          providers: getProviders().map((p) => p.name),
        },
      },
      { status: 500 }
    );
  }
}
