import { NextResponse } from "next/server";
import { ClientService } from "@/services/ClientService";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { GENDERS } from "@/lib/types";

// TODO: gate with real role checks once route-level auth middleware lands. For now the frontend
// decides whether to pass `realtorId` (Administrator/Operator, scoped to their own) or omit it
// (Root, sees every realtor's clients) — see components/clients/ClientsPage.tsx.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const realtorId = searchParams.get("realtorId");

    const data = realtorId ? await ClientService.listForRealtor(realtorId) : await ClientService.list();
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/clients error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const realtorId = body.realtorId;
    const gender = GENDERS.includes(body.gender) ? body.gender : null;

    if (!firstName) return NextResponse.json({ message: "First name is required" }, { status: 400 });
    if (!lastName) return NextResponse.json({ message: "Last name is required" }, { status: 400 });
    if (!realtorId) return NextResponse.json({ message: "realtorId is required" }, { status: 400 });

    const realtor = await RealtorService.get(realtorId);
    if (!realtor) return NextResponse.json({ message: "Realtor not found" }, { status: 400 });

    const data = await ClientService.create({
      realtorId,
      gender,
      firstName,
      lastName,
      tin: body.tin?.trim() ?? "",
      city: body.city?.trim() ?? "",
      address: body.address?.trim() ?? "",
      zipcode: body.zipcode?.trim() ?? "",
      email: body.email?.trim().toLowerCase() ?? "",
      phone: body.phone?.trim() ?? "",
      mobile: body.mobile?.trim() ?? "",
    });

    await LogEntryService.info({
      category: "Clients",
      message: `Client ${data.firstName} ${data.lastName} was created`,
      userId: await getCurrentUserId(),
      realtorId,
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/clients error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
