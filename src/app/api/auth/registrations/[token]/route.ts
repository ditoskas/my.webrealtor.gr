import { NextResponse } from "next/server";
import { RegistrationService } from "@/services/RegistrationService";

// Read-only — lets the confirmation page check the token and show the associated email before
// rendering the realtor-info form. Does not consume the token; only completeRegistration does.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const pending = await RegistrationService.getPendingByToken(token);
    if (!pending) {
      return NextResponse.json({ message: "Invalid or expired registration link" }, { status: 404 });
    }
    return NextResponse.json({ data: { email: pending.email }, success: true });
  } catch (error) {
    console.error("GET /api/auth/registrations/[token] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
