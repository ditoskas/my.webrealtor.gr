import { NextResponse } from "next/server";
import { TagService } from "@/services/TagService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });

    const existing = await TagService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const realtorId = existing.realtorId.toString();
    const duplicate = await TagService.findByRealtorIdAndName(realtorId, name);
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json({ message: "A tag with this name already exists" }, { status: 409 });
    }

    const data = await TagService.update(id, { name });

    await LogEntryService.info({
      category: "Tags",
      message: `Tag "${existing.name}" was renamed to "${name}"`,
      userId: await getCurrentUserId(),
      realtorId,
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/tags/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await TagService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await TagService.remove(id);

    await LogEntryService.info({
      category: "Tags",
      message: `Tag "${existing.name}" was deleted`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tags/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
