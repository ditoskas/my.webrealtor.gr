import { NextResponse } from "next/server";
import { AssetService } from "@/services/AssetService";
import { PriceHistoryService } from "@/services/PriceHistoryService";

// Read-only, same convention as GET /api/logs — price history is only ever written from within
// the asset create/update routes (see PriceHistoryService), never through this endpoint. Existing
// PriceHistory entries were recorded with listingType "Property"/"Land" (see CLAUDE.md → "Asset
// management" — that collection was never migrated), so this route resolves the asset's own
// isLand first to know which listingType to look up.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const asset = await AssetService.get(id);
    if (!asset) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const data = await PriceHistoryService.listForListing(id, asset.isLand ? "Land" : "Property");
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/assets/[id]/price-history error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
