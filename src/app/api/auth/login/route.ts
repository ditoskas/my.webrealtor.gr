import { NextResponse } from "next/server";
import { AuthService } from "@/services/AuthService";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE_SECONDS } from "@/lib/auth";
import type { LoginCredentials } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LoginCredentials>;
    if (!body.email || !body.password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const result = await AuthService.login({ email: body.email, password: body.password });

    const response = NextResponse.json(result);
    response.cookies.set(AUTH_COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }
}
