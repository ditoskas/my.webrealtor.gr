import { NextResponse } from "next/server";
import { RealtorService } from "@/services/RealtorService";
import { PropertyCategoryService } from "@/services/PropertyCategoryService";
import { LandCategoryService } from "@/services/LandCategoryService";
import { AssetService } from "@/services/AssetService";
import { TagService } from "@/services/TagService";
import { PublicApiResponse } from "@/lib/publicApiResponse";
import { TRANSACTION_TYPES, type TransactionType } from "@/lib/types";
import { serializePublicAsset } from "./serializePublicAsset";

// The second deliberately-public, unauthenticated, cross-origin endpoint in this app (alongside
// POST /api/public/message) — see PUBLIC_API.md for the full third-party-facing contract. Lets a
// realtor's own website pull their own active/pending listings to render on their own pages —
// both properties and land assets (see CLAUDE.md → "Asset management"), distinguished by `isLand`
// on every payload item; `kind`/`landType` narrow the land side the same way `type` already
// narrows the property side. `tag` narrows by one of the realtor's own Tags (see CLAUDE.md →
// "Tags") by exact (case-insensitive) name. Named /api/public/assets (renamed from
// /api/public/properties before this app had any real external consumers to keep
// backward-compatible — see PUBLIC_API.md).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function isTransactionType(value: string): value is TransactionType {
  return (TRANSACTION_TYPES as string[]).includes(value);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guid = searchParams.get("guid")?.trim() ?? "";
    const type = searchParams.get("type")?.trim() ?? "";
    const landType = searchParams.get("landType")?.trim() ?? "";
    const kind = searchParams.get("kind")?.trim() ?? "";
    const tag = searchParams.get("tag")?.trim() ?? "";
    const action = searchParams.get("action")?.trim() ?? "";
    const minPriceRaw = searchParams.get("minPrice");
    const maxPriceRaw = searchParams.get("maxPrice");

    if (!guid) {
      return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
    }

    const realtor = await RealtorService.findByGuid(guid);
    if (!realtor) {
      return PublicApiResponse.error("Not found").toResponse(404, CORS_HEADERS);
    }

    let isLand: boolean | undefined;
    if (kind) {
      if (kind !== "property" && kind !== "land") {
        return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
      }
      isLand = kind === "land";
    }

    let propertyCategoryId: string | undefined;
    if (type) {
      const category = await PropertyCategoryService.findBySlug(type);
      if (!category) return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
      propertyCategoryId = category.id;
    }

    let landCategoryId: string | undefined;
    if (landType) {
      const category = await LandCategoryService.findBySlug(landType);
      if (!category) return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
      landCategoryId = category.id;
    }

    let tagId: string | undefined;
    if (tag) {
      const tagRecord = await TagService.findByRealtorIdAndName(realtor.id, tag);
      if (!tagRecord) return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
      tagId = tagRecord.id;
    }

    let transactionType: TransactionType | undefined;
    if (action) {
      if (!isTransactionType(action)) {
        return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
      }
      transactionType = action;
    }

    let minPrice: number | undefined;
    if (minPriceRaw !== null) {
      minPrice = Number(minPriceRaw);
      if (!Number.isFinite(minPrice) || minPrice < 0) {
        return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
      }
    }

    let maxPrice: number | undefined;
    if (maxPriceRaw !== null) {
      maxPrice = Number(maxPriceRaw);
      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
      }
    }

    if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
      return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
    }

    const assets = await AssetService.listPublicForRealtor(realtor.id, {
      isLand,
      propertyCategoryId,
      landCategoryId,
      tagId,
      transactionType,
      minPrice,
      maxPrice,
    });

    return PublicApiResponse.success(assets.map(serializePublicAsset)).toResponse(200, CORS_HEADERS);
  } catch (error) {
    console.error("GET /api/public/assets error", error);
    return PublicApiResponse.error("Internal server error").toResponse(500, CORS_HEADERS);
  }
}
