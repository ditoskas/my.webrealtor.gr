import { NextResponse } from "next/server";
import { PropertyService } from "@/services/PropertyService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { parseImagesBody } from "@/lib/parseImagesBody";

// Dedicated sub-resource for the Media page (see components/properties/PropertyMediaPage) — lets
// it persist the images array without re-sending/re-validating the other ~90 Property fields the
// main PUT /api/properties/[id] requires (see parsePropertyBody).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await PropertyService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const { errors, images } = parseImagesBody(body.images);
    if (errors.length > 0) return NextResponse.json({ message: errors[0] }, { status: 400 });

    const data = await PropertyService.update(id, { images });

    await LogEntryService.info({
      category: "Properties",
      message: `Media updated for property "${existing.title || existing.id}"`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: { images: existing.images } as unknown as Record<string, unknown>,
      dataTo: { images: data?.images } as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/properties/[id]/images error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
