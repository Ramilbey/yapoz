import { NextResponse } from "next/server";
import { db, t, sql } from "@/db";
import { env } from "@/lib/env";
import { getProviders } from "@/agent/ai-router";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const testAI = urlObj.searchParams.get("test") === "ai";

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

    let aiDiagnostics: Record<string, any> | undefined = undefined;
    if (testAI) {
      aiDiagnostics = {};
      const OpenAI = (await import("openai")).default;
      for (const p of getProviders()) {
        try {
          const client = new OpenAI({ apiKey: p.apiKey, baseURL: p.baseURL, timeout: 10000 });
          const res = await client.chat.completions.create({
            model: p.smartModel,
            messages: [{ role: "user", content: "Say hello in one word." }],
            max_tokens: 10,
          });
          aiDiagnostics[p.name] = {
            ok: true,
            model: p.smartModel,
            reply: res.choices[0]?.message?.content,
          };
        } catch (err: any) {
          aiDiagnostics[p.name] = {
            ok: false,
            model: p.smartModel,
            error: err?.message || String(err),
            status: err?.status,
          };
        }
      }
    }

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
        diagnostics: aiDiagnostics,
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
