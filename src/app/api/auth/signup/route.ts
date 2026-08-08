import { NextResponse } from "next/server";
import { RegistrationService } from "@/services/RegistrationService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });
    if (!password || password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }

    await RegistrationService.signup(email, password);

    // Always the same generic success response, whether or not the email was already
    // registered — see RegistrationService.signup for the enumeration-safety reasoning.
    return NextResponse.json({
      success: true,
      message: "If this email can be registered, a confirmation link has been sent.",
    });
  } catch (error) {
    console.error("POST /api/auth/signup error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
