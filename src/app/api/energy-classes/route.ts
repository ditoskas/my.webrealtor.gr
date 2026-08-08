import { NextResponse } from "next/server";
import { EnergyClassService } from "@/services/EnergyClassService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

// TODO: gate with the Root-role check once route-level auth middleware lands.

export async function GET() {
  try {
    const data = await EnergyClassService.list();
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/energy-classes error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();

    if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });

    const existing = await EnergyClassService.findByName(name);
    if (existing) {
      return NextResponse.json({ message: "An energy class with this name already exists" }, { status: 409 });
    }

    const data = await EnergyClassService.create({ name });

    await LogEntryService.info({
      category: "EnergyClass",
      message: `Energy class "${data.name}" was created`,
      userId: await getCurrentUserId(),
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/energy-classes error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
