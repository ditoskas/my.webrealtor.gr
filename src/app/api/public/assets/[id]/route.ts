import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { RealtorService } from "@/services/RealtorService";
import { AssetService } from "@/services/AssetService";
import { PublicApiResponse } from "@/lib/publicApiResponse";
import { serializePublicAsset } from "../serializePublicAsset";

// Detail counterpart to GET /api/public/assets (list) — see PUBLIC_API.md. Same guid-scoped,
// unauthenticated, cross-origin contract, one asset (property or land, see CLAUDE.md → "Asset
// management") instead of a filtered collection.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const guid = searchParams.get("guid")?.trim() ?? "";

    if (!guid || !mongoose.Types.ObjectId.isValid(id)) {
      return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
    }

    const realtor = await RealtorService.findByGuid(guid);
    if (!realtor) {
      return PublicApiResponse.error("Not found").toResponse(404, CORS_HEADERS);
    }

    // Scoped to this realtor and active/pending status in one query (getPublicForRealtor) — an
    // asset owned by a different realtor, or not publicly listed, is indistinguishable from a
    // nonexistent one to the caller, both returning the same "Not found".
    const asset = await AssetService.getPublicForRealtor(id, realtor.id);
    if (!asset) {
      return PublicApiResponse.error("Not found").toResponse(404, CORS_HEADERS);
    }

    return PublicApiResponse.success(serializePublicAsset(asset)).toResponse(200, CORS_HEADERS);
  } catch (error) {
    console.error("GET /api/public/assets/[id] error", error);
    return PublicApiResponse.error("Internal server error").toResponse(500, CORS_HEADERS);
  }
}
