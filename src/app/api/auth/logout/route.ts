import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Explicit matching attributes (not a bare .delete(name)) — a cookie is only overwritten when
  // path/sameSite/secure match how it was set (see POST /api/auth/login), so this mirrors that
  // exactly rather than relying on defaults to happen to line up.
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
