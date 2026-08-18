import { NextResponse } from "next/server";
import { AssetService } from "@/services/AssetService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { parseImagesBody } from "@/lib/parseImagesBody";

// Dedicated sub-resource for the Media page (see components/assets/AssetMediaPage) — lets it
// persist the images array without re-sending/re-validating the rest of the asset's fields the
// main PUT /api/assets/[id] requires (see parseAssetBody).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await AssetService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const { errors, images } = parseImagesBody(body.images);
    if (errors.length > 0) return NextResponse.json({ message: errors[0] }, { status: 400 });

    const data = await AssetService.update(id, { images });

    const category = existing.isLand ? "Land" : "Properties";
    const kindLabel = existing.isLand ? "land listing" : "property";

    await LogEntryService.info({
      category,
      message: `Media updated for ${kindLabel} "${existing.title || existing.id}"`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: { images: existing.images } as unknown as Record<string, unknown>,
      dataTo: { images: data?.images } as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/assets/[id]/images error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
