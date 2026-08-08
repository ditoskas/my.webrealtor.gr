import { NextResponse } from "next/server";
import { AuthService } from "@/services/AuthService";
import { getCurrentUserId } from "@/lib/auth";

interface UpdateDisplayNameBody {
  displayName?: string;
}

// Self-service (Profile page) — every role can change their own display name. Inherently
// self-scoped by construction (always operates on getCurrentUserId(), never a caller-supplied id),
// same reasoning as /api/auth/language — see CLAUDE.md → Profile.
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateDisplayNameBody;
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";

    const data = await AuthService.updateDisplayName(userId, displayName);

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("POST /api/auth/display-name error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
