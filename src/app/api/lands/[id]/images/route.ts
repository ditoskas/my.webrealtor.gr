import { NextResponse } from "next/server";
import { LandService } from "@/services/LandService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { parseImagesBody } from "@/lib/parseImagesBody";

// Dedicated sub-resource for the Media page (see components/lands/LandMediaPage) — same reasoning
// as PUT /api/properties/[id]/images: persist just the images array without re-sending/
// re-validating the other Land fields the main PUT /api/lands/[id] requires (see parseLandBody).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await LandService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const { errors, images } = parseImagesBody(body.images);
    if (errors.length > 0) return NextResponse.json({ message: errors[0] }, { status: 400 });

    const data = await LandService.update(id, { images });

    await LogEntryService.info({
      category: "Land",
      message: `Media updated for land listing "${existing.title || existing.id}"`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: { images: existing.images } as unknown as Record<string, unknown>,
      dataTo: { images: data?.images } as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/lands/[id]/images error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
