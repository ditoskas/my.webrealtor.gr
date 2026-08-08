import { NextResponse } from "next/server";
import { ZoningTypeService } from "@/services/ZoningTypeService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await ZoningTypeService.get(id);
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/zoning-types/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await ZoningTypeService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const name = body.name?.trim();
    const slug = body.slug?.trim().toLowerCase();

    if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });
    if (!slug) return NextResponse.json({ message: "Slug is required" }, { status: 400 });

    if (slug !== existing.slug) {
      const slugOwner = await ZoningTypeService.findBySlug(slug);
      if (slugOwner && slugOwner.id !== id) {
        return NextResponse.json({ message: "A zoning type with this slug already exists" }, { status: 409 });
      }
    }

    const data = await ZoningTypeService.update(id, { name, slug });

    await LogEntryService.info({
      category: "ZoningType",
      message: `Zoning type "${existing.name}" was updated`,
      userId: await getCurrentUserId(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/zoning-types/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await ZoningTypeService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await ZoningTypeService.remove(id);

    await LogEntryService.info({
      category: "ZoningType",
      message: `Zoning type "${existing.name}" was deleted`,
      userId: await getCurrentUserId(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/zoning-types/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
