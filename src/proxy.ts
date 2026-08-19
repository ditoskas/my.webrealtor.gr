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
  // `uploads` is excluded alongside `api`: GET /uploads/[...path] (src/app/uploads/[...path]/
  // route.ts) is a deliberately public, unauthenticated file-serving route — living outside
  // app/api/ only so its URL is /uploads/<file> instead of /api/uploads/<file> — but without this
  // exclusion this matcher still caught it, so every request (including the public property/land
  // photos GET /api/public/assets returns to third-party sites) got redirected to /login instead
  // of the actual file. That 302/307-to-HTML response is exactly what trips Chrome's Opaque
  // Response Blocking (ERR_BLOCKED_BY_ORB) on a cross-origin <img> load.
  matcher: ["/((?!api|uploads|_next/static|_next/image|favicon.ico|icon.png).*)"],
};
