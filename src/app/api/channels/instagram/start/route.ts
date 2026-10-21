import { SignJWT } from "jose";
import { apiSession, handle } from "@/lib/auth";
import { env } from "@/lib/env";
import { igAuthUrl } from "@/channels/instagram-auth";

export const dynamic = "force-dynamic";

/** Sends the owner to Instagram to approve Jawab for their professional account. */
export const GET = handle(async () => {
  const s = await apiSession(["owner"]);
  if (!env.instagram.appId || !env.instagram.appSecret) return Response.redirect(`${env.appUrl}/app/settings?instagram=error&reason=${encodeURIComponent("Instagram isn't set up on this server yet (INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET).")}`);
  const state = await new SignJWT({ ws: s.workspaceId, uid: s.userId, k: "ig" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("15m").sign(new TextEncoder().encode(env.authSecret));
  return Response.redirect(igAuthUrl(state));
});
