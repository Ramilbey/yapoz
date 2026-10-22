import { apiSession, handle } from "@/lib/auth";
import { authUrl, googleConfigured } from "@/hiring/google";
import { SignJWT } from "jose";
import { env } from "@/lib/env";

export const GET = handle(async () => {
  const s = await apiSession(["owner", "hr"]);
  if (!googleConfigured()) return Response.json({ error: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first." }, { status: 400 });
  const state = await new SignJWT({ ws: s.workspaceId, uid: s.userId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("10m").sign(new TextEncoder().encode(env.authSecret));
  return Response.redirect(authUrl(state));
});
