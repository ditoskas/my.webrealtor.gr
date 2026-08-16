import { NextResponse } from "next/server";
import { RealtorService } from "@/services/RealtorService";
import { PropertyCategoryService } from "@/services/PropertyCategoryService";
import { PropertyService } from "@/services/PropertyService";
import { PublicApiResponse } from "@/lib/publicApiResponse";
import { TRANSACTION_TYPES, type TransactionType } from "@/lib/types";

// The second deliberately-public, unauthenticated, cross-origin endpoint in this app (alongside
// POST /api/public/message) — see PUBLIC_API.md for the full third-party-facing contract. Lets a
// realtor's own website pull their own active/pending listings to render on their own pages.
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

// Strips internal-only refs (clientId links to a Client, realtorId is implied by guid) and
// flattens the populated propertyCategoryId into a plain `propertyCategory` object — see
// PropertyRepository.findPublicByRealtorId's .populate() call.
function serializePublicProperty(property: { toJSON: () => Record<string, unknown> }) {
  const { clientId: _clientId, realtorId: _realtorId, propertyCategoryId, ...rest } = property.toJSON();
  return { ...rest, propertyCategory: propertyCategoryId ?? null };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guid = searchParams.get("guid")?.trim() ?? "";
    const type = searchParams.get("type")?.trim() ?? "";
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

    let propertyCategoryId: string | undefined;
    if (type) {
      const category = await PropertyCategoryService.findBySlug(type);
      if (!category) return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
      propertyCategoryId = category.id;
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

    const properties = await PropertyService.listPublicForRealtor(realtor.id, {
      propertyCategoryId,
      transactionType,
      minPrice,
      maxPrice,
    });

    return PublicApiResponse.success(properties.map(serializePublicProperty)).toResponse(200, CORS_HEADERS);
  } catch (error) {
    console.error("GET /api/public/properties error", error);
    return PublicApiResponse.error("Internal server error").toResponse(500, CORS_HEADERS);
  }
}
