import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken, toPublicUser } from "@/lib/auth";
import { UserService } from "@/services/UserService";

// Used by the client to hydrate the auth store after a full page load/refresh (Redux state
// doesn't survive that). proxy.ts does the same JWT verification for route gating, but a
// Server/Client Component can't read proxy's decision — this route is how the client learns
// who's currently logged in.
export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const payload = verifyAuthToken(token);
  if (!payload) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const user = await UserService.get(payload.sub);
  if (!user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  return NextResponse.json({ data: toPublicUser(user), success: true });
}
