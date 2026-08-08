import { NextResponse } from "next/server";
import { RegistrationService } from "@/services/RegistrationService";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE_SECONDS } from "@/lib/auth";
import type { RealtorInput } from "@/lib/types";

interface CompleteRegistrationBody {
  token?: string;
  realtor?: Partial<RealtorInput>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompleteRegistrationBody;
    const token = body.token?.trim();

    const firstName = body.realtor?.firstName?.trim();
    const lastName = body.realtor?.lastName?.trim();
    const email = body.realtor?.email?.trim();

    if (!token) return NextResponse.json({ message: "Missing registration token" }, { status: 400 });
    if (!firstName) return NextResponse.json({ message: "First name is required" }, { status: 400 });
    if (!lastName) return NextResponse.json({ message: "Last name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    const result = await RegistrationService.completeRegistration(token, {
      firstName,
      lastName,
      email,
      phone: body.realtor?.phone?.trim() ?? "",
      mobile: body.realtor?.mobile?.trim() ?? "",
      city: body.realtor?.city?.trim() ?? "",
      address: body.realtor?.address?.trim() ?? "",
      postcode: body.realtor?.postcode?.trim() ?? "",
      googleMapsUrl: body.realtor?.googleMapsUrl?.trim() ?? "",
      website: body.realtor?.website?.trim() ?? "",
      saleCommission: typeof body.realtor?.saleCommission === "number" ? body.realtor.saleCommission : null,
      rentCommission: typeof body.realtor?.rentCommission === "number" ? body.realtor.rentCommission : null,
    });

    const response = NextResponse.json({ success: true, data: result });
    response.cookies.set(AUTH_COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invalid or expired registration link") {
        return NextResponse.json({ message: error.message }, { status: 410 });
      }
      if (error.message === "This email is already registered" || error.message === "A realtor with this email already exists") {
        return NextResponse.json({ message: error.message }, { status: 409 });
      }
    }
    console.error("POST /api/auth/complete-registration error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
