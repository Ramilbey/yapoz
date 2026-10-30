import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, canOpen, ROLE_HOME } from "@/lib/session";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * API writes from a browser must come from this site (defence against cross-site request forgery on top of SameSite
 * cookies). Server-to-server callers (Meta, Telegram, cron) send no Origin and are checked by their own signatures.
 */
function crossSite(req: NextRequest) {
  if (SAFE.has(req.method)) return false;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== (req.headers.get("x-forwarded-host") ?? req.nextUrl.host);
  } catch {
    return true;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    if (crossSite(req)) return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
    return NextResponse.next();
  }
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname === "/app" || pathname === "/app/") {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? "/app/orders", req.url));
  }
  if (!canOpen(session.role, pathname)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? "/app/orders", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app", "/app/:path*", "/api/:path*"] };
