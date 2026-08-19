import { NextResponse } from "next/server";
import { AssetService } from "@/services/AssetService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

// Publishes/unpublishes a listing — see CLAUDE.md → "Asset management" and AssetService.setPublished.
// Deliberately its own endpoint rather than folded into the generic PUT /api/assets/[id] (same
// reasoning as POST/DELETE /api/realtors/[id]/image): a one-field state flip triggered from the
// Assets list row action, not the full edit form, so it shouldn't require (or risk overwriting)
// the rest of the listing's ~90 fields.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await AssetService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const data = await AssetService.setPublished(id, true);

    const kindLabel = existing.isLand ? "Land listing" : "Property";
    await LogEntryService.info({
      category: existing.isLand ? "Land" : "Properties",
      message: `${kindLabel} "${existing.title || existing.id}" was published`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: { publishedAt: existing.publishedAt },
      dataTo: { publishedAt: data?.publishedAt },
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("POST /api/assets/[id]/publish error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await AssetService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const data = await AssetService.setPublished(id, false);

    const kindLabel = existing.isLand ? "Land listing" : "Property";
    await LogEntryService.info({
      category: existing.isLand ? "Land" : "Properties",
      message: `${kindLabel} "${existing.title || existing.id}" was unpublished`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: { publishedAt: existing.publishedAt },
      dataTo: { publishedAt: data?.publishedAt },
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("DELETE /api/assets/[id]/publish error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
