import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function POST() {
  const s = await getSession();
  (await cookies()).delete(SESSION_COOKIE);
  if (s) await audit(s, "auth.logout");
  return Response.json({ ok: true });
}
