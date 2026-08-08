import { NextResponse } from "next/server";
import { AuthService } from "@/services/AuthService";
import { getCurrentUserId } from "@/lib/auth";
import { isLocale } from "@/lib/i18n/locales";

interface UpdateLanguageBody {
  language?: string;
}

// Self-service (Profile page) — every role can change their own display language. Inherently
// self-scoped by construction (always operates on getCurrentUserId(), never a caller-supplied id),
// same reasoning as /api/auth/change-password — see CLAUDE.md → Profile.
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateLanguageBody;
    if (!body.language || !isLocale(body.language)) {
      return NextResponse.json({ message: "A valid language is required" }, { status: 400 });
    }

    const data = await AuthService.updateLanguage(userId, body.language);

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("POST /api/auth/language error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
