import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, canOpen, ROLE_HOME } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname === "/app" || pathname === "/app/") {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  }
  if (!canOpen(session.role, pathname)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app", "/app/:path*"] };
