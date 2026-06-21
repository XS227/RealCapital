import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";

export const config = {
  matcher: [
    // Apply security headers to all routes
    "/((?!_next/static|_next/image|favicon.svg).*)",
  ],
};

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options":           "DENY",
  "X-Content-Type-Options":    "nosniff",
  "X-DNS-Prefetch-Control":    "off",
  "Referrer-Policy":           "strict-origin-when-cross-origin",
  "Permissions-Policy":        "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

function addSecurityHeaders(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Admin route protection
  if (path.startsWith("/admin")) {
    if (path === "/admin/login") {
      return addSecurityHeaders(NextResponse.next());
    }

    const res = new NextResponse();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    if (!session.isAdmin) {
      url.pathname = "/admin/login";
      url.searchParams.set("next", path);
      return addSecurityHeaders(NextResponse.redirect(url));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}
