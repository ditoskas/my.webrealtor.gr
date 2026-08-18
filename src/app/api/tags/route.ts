import { NextResponse } from "next/server";
import { TagService } from "@/services/TagService";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

// TODO: gate with real role checks once route-level auth middleware lands. Unlike most list
// routes there's no unscoped list() here — a tag is always reached through one specific realtor,
// so `realtorId` is required, not optional (see CLAUDE.md → "Tags").
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const realtorId = searchParams.get("realtorId");
    if (!realtorId) return NextResponse.json({ message: "realtorId is required" }, { status: 400 });

    const data = await TagService.listForRealtor(realtorId);
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/tags error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const realtorId = body.realtorId;
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!realtorId) return NextResponse.json({ message: "realtorId is required" }, { status: 400 });
    if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });

    const realtor = await RealtorService.get(realtorId);
    if (!realtor) return NextResponse.json({ message: "Realtor not found" }, { status: 400 });

    const existing = await TagService.findByRealtorIdAndName(realtorId, name);
    if (existing) return NextResponse.json({ message: "A tag with this name already exists" }, { status: 409 });

    const data = await TagService.create({ realtorId, name });

    await LogEntryService.info({
      category: "Tags",
      message: `Tag "${data.name}" was created`,
      userId: await getCurrentUserId(),
      realtorId,
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tags error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
