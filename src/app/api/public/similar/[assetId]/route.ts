import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { RealtorService } from "@/services/RealtorService";
import { AssetService } from "@/services/AssetService";
import { PublicApiResponse } from "@/lib/publicApiResponse";
import { serializePublicAsset } from "../../assets/serializePublicAsset";

// A third public, unauthenticated, cross-origin endpoint alongside GET /api/public/assets (list/
// detail) and POST /api/public/message — see PUBLIC_API.md. Given a reference asset, returns up to
// 3 other active/pending assets from the same realtor, matching the reference's action (buy/rent)
// and, where possible, its category — falling back to every category once same-category matches
// run under 3, closest in price first. See AssetService.findSimilar for the matching/fallback
// logic itself.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const { searchParams } = new URL(request.url);
    const guid = searchParams.get("guid")?.trim() ?? "";

    if (!guid || !mongoose.Types.ObjectId.isValid(assetId)) {
      return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
    }

    const realtor = await RealtorService.findByGuid(guid);
    if (!realtor) {
      return PublicApiResponse.error("Not found").toResponse(404, CORS_HEADERS);
    }

    // Scoped to this realtor and active/pending status, same as /api/public/assets/[id] — a
    // reference asset owned by a different realtor, or not publicly listed, is indistinguishable
    // from a nonexistent one to the caller, both returning the same "Not found".
    const similar = await AssetService.findSimilar(assetId, realtor.id);
    if (similar === null) {
      return PublicApiResponse.error("Not found").toResponse(404, CORS_HEADERS);
    }

    return PublicApiResponse.success(similar.map(serializePublicAsset)).toResponse(200, CORS_HEADERS);
  } catch (error) {
    console.error("GET /api/public/similar/[assetId] error", error);
    return PublicApiResponse.error("Internal server error").toResponse(500, CORS_HEADERS);
  }
}
