import { NextResponse } from "next/server";
import { EnergyClassService } from "@/services/EnergyClassService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await EnergyClassService.get(id);
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/energy-classes/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await EnergyClassService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const name = body.name?.trim();
    if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });

    if (name !== existing.name) {
      const nameOwner = await EnergyClassService.findByName(name);
      if (nameOwner && nameOwner.id !== id) {
        return NextResponse.json({ message: "An energy class with this name already exists" }, { status: 409 });
      }
    }

    const data = await EnergyClassService.update(id, { name });

    await LogEntryService.info({
      category: "EnergyClass",
      message: `Energy class "${existing.name}" was updated`,
      userId: await getCurrentUserId(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/energy-classes/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await EnergyClassService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await EnergyClassService.remove(id);

    await LogEntryService.info({
      category: "EnergyClass",
      message: `Energy class "${existing.name}" was deleted`,
      userId: await getCurrentUserId(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/energy-classes/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
