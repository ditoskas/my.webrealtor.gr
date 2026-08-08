import { NextResponse } from "next/server";
import { ClientService } from "@/services/ClientService";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { GENDERS } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await ClientService.get(id);
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/clients/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await ClientService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const realtorId = body.realtorId;
    const gender = GENDERS.includes(body.gender) ? body.gender : null;

    if (!firstName) return NextResponse.json({ message: "First name is required" }, { status: 400 });
    if (!lastName) return NextResponse.json({ message: "Last name is required" }, { status: 400 });
    if (!realtorId) return NextResponse.json({ message: "realtorId is required" }, { status: 400 });

    if (realtorId !== existing.realtorId.toString()) {
      const realtor = await RealtorService.get(realtorId);
      if (!realtor) return NextResponse.json({ message: "Realtor not found" }, { status: 400 });
    }

    const data = await ClientService.update(id, {
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
      message: `Client ${existing.firstName} ${existing.lastName} was updated`,
      userId: await getCurrentUserId(),
      realtorId,
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/clients/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await ClientService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await ClientService.remove(id);

    await LogEntryService.info({
      category: "Clients",
      message: `Client ${existing.firstName} ${existing.lastName} was deleted`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/clients/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
