import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (defaults to the Node.js runtime, which is
// why `jsonwebtoken`/Node crypto work fine here — see CLAUDE.md → Auth for details).

const PUBLIC_PATHS = ["/login", "/signup", "/confirm-registration"];

// Root reaches every section. Administrator/Operator are restricted to Dashboard/Clients/
// Assets/Transactions — everything else (Realtors, Users, Settings, Logs, Messages) is Root-only.
const ROOT_ONLY_PREFIXES = ["/realtors", "/users", "/settings", "/logs", "/messages"];

function hasAccess(role: UserRole, pathname: string): boolean {
  if (role === "Root") return true;
  return !ROOT_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? verifyAuthToken(token) : null;

  if (!payload) {
    if (isPublicPath) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in — don't let them sit on (or navigate back to) the login page.
  if (isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!hasAccess(payload.role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png).*)"],
};
