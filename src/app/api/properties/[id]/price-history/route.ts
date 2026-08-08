import { NextResponse } from "next/server";
import { PriceHistoryService } from "@/services/PriceHistoryService";

// Read-only, same convention as GET /api/logs — price history is only ever written from within
// the property create/update routes (see PriceHistoryService), never through this endpoint.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await PriceHistoryService.listForListing(id, "Property");
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/properties/[id]/price-history error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
