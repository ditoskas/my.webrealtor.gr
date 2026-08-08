import { NextResponse } from "next/server";
import { AuthService } from "@/services/AuthService";
import { getCurrentUserId } from "@/lib/auth";

interface ChangePasswordBody {
  currentPassword?: string;
  newPassword?: string;
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as ChangePasswordBody;
    if (!body.currentPassword) {
      return NextResponse.json({ message: "Current password is required" }, { status: 400 });
    }
    if (!body.newPassword || body.newPassword.length < 8) {
      return NextResponse.json({ message: "New password must be at least 8 characters" }, { status: 400 });
    }

    await AuthService.changePassword(userId, body.currentPassword, body.newPassword);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Current password is incorrect") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("POST /api/auth/change-password error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
