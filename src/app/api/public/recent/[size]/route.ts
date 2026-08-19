import { NextResponse } from "next/server";
import { RealtorService } from "@/services/RealtorService";
import { AssetService } from "@/services/AssetService";
import { PublicApiResponse } from "@/lib/publicApiResponse";
import { serializePublicAsset } from "../../assets/serializePublicAsset";

// A fourth public, unauthenticated, cross-origin endpoint alongside GET /api/public/assets
// (list/detail), GET /api/public/similar/[assetId], and POST /api/public/message — see
// PUBLIC_API.md. Returns a realtor's `size` most recently *published* listings (both kinds, see
// CLAUDE.md → "Asset management"), for a "latest listings" widget. `size` is a path segment, not
// a query param, since it's always meaningful (unlike every other filter on these endpoints,
// which is optional) — an invalid or missing value falls back to DEFAULT_RECENT_SIZE rather than
// a 400, and any value is silently clamped to MAX_RECENT_SIZE so a caller can't ask for the
// realtor's entire catalog through this endpoint.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DEFAULT_RECENT_SIZE = 3;
const MAX_RECENT_SIZE = 20;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function parseSize(raw: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) return DEFAULT_RECENT_SIZE;
  return Math.min(value, MAX_RECENT_SIZE);
}

export async function GET(request: Request, { params }: { params: Promise<{ size: string }> }) {
  try {
    const { size } = await params;
    const { searchParams } = new URL(request.url);
    const guid = searchParams.get("guid")?.trim() ?? "";

    if (!guid) {
      return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
    }

    const realtor = await RealtorService.findByGuid(guid);
    if (!realtor) {
      return PublicApiResponse.error("Not found").toResponse(404, CORS_HEADERS);
    }

    const limit = parseSize(size);
    const assets = await AssetService.listRecentPublished(realtor.id, limit);

    return PublicApiResponse.success(assets.map(serializePublicAsset)).toResponse(200, CORS_HEADERS);
  } catch (error) {
    console.error("GET /api/public/recent/[size] error", error);
    return PublicApiResponse.error("Internal server error").toResponse(500, CORS_HEADERS);
  }
}
