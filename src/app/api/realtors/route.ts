import { NextResponse } from "next/server";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

// TODO: gate with the Admin-role check once route-level auth middleware lands.

export async function GET() {
  try {
    const data = await RealtorService.list();
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/realtors error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!firstName) return NextResponse.json({ message: "First name is required" }, { status: 400 });
    if (!lastName) return NextResponse.json({ message: "Last name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    const existing = await RealtorService.findByEmail(email);
    if (existing) {
      return NextResponse.json({ message: "A realtor with this email already exists" }, { status: 409 });
    }

    const data = await RealtorService.create({
      firstName,
      lastName,
      email,
      phone: body.phone?.trim() ?? "",
      mobile: body.mobile?.trim() ?? "",
      city: body.city?.trim() ?? "",
      address: body.address?.trim() ?? "",
      postcode: body.postcode?.trim() ?? "",
      googleMapsUrl: body.googleMapsUrl?.trim() ?? "",
      website: body.website?.trim() ?? "",
      realtorNumber: body.realtorNumber?.trim() ?? "",
      saleCommission: typeof body.saleCommission === "number" ? body.saleCommission : null,
      rentCommission: typeof body.rentCommission === "number" ? body.rentCommission : null,
    });

    await LogEntryService.info({
      category: "Realtors",
      message: `Realtor ${data.firstName} ${data.lastName} (${data.email}) was created`,
      userId: await getCurrentUserId(),
      realtorId: data.id,
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/realtors error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
