import { NextResponse } from "next/server";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await RealtorService.getWithCounts(id);
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/realtors/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await RealtorService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!firstName) return NextResponse.json({ message: "First name is required" }, { status: 400 });
    if (!lastName) return NextResponse.json({ message: "Last name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    if (email !== existing.email) {
      const emailOwner = await RealtorService.findByEmail(email);
      if (emailOwner && emailOwner.id !== id) {
        return NextResponse.json({ message: "A realtor with this email already exists" }, { status: 409 });
      }
    }

    const data = await RealtorService.update(id, {
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
      message: `Realtor ${existing.firstName} ${existing.lastName} was updated`,
      userId: await getCurrentUserId(),
      realtorId: id,
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/realtors/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await RealtorService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await RealtorService.remove(id);

    await LogEntryService.info({
      category: "Realtors",
      message: `Realtor ${existing.firstName} ${existing.lastName} was deleted`,
      userId: await getCurrentUserId(),
      realtorId: id,
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/realtors/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
