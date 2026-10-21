import { jwtVerify } from "jose";
import { env } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { connectInstagram } from "@/channels/instagram-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const back = (q: string) => Response.redirect(`${env.appUrl}/app/settings?${q}#channels`);
  try {
    const { payload } = await jwtVerify(u.searchParams.get("state") ?? "", new TextEncoder().encode(env.authSecret));
    if (payload.k !== "ig") throw new Error("Bad state");
    // The person finishing the flow must still be signed in to the same business.
    const s = await getSession();
    if (!s || s.workspaceId !== payload.ws || s.role !== "owner") throw new Error("Sign in as the owner and try again.");
    const code = u.searchParams.get("code");
    if (!code) throw new Error(u.searchParams.get("error_description") ?? u.searchParams.get("error_reason") ?? "Instagram didn't approve the connection.");
    const r = await connectInstagram(String(payload.ws), code);
    return back(`instagram=connected&username=${encodeURIComponent(r.username ?? "")}`);
  } catch (e) {
    return back(`instagram=error&reason=${encodeURIComponent(e instanceof Error ? e.message : "failed")}`);
  }
}
