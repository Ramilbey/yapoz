import { jwtVerify } from "jose";
import { exchangeCode } from "@/hiring/google";
import { env } from "@/lib/env";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state") ?? "";
  try {
    const { payload } = await jwtVerify(state, new TextEncoder().encode(env.authSecret));
    if (!code) throw new Error(u.searchParams.get("error") ?? "No code");
    await exchangeCode(String(payload.ws), String(payload.uid), code);
    return Response.redirect(`${env.appUrl}/app/hiring/calendar?google=connected`);
  } catch (e) {
    return Response.redirect(`${env.appUrl}/app/hiring/calendar?google=error&reason=${encodeURIComponent(e instanceof Error ? e.message : "failed")}`);
  }
}
