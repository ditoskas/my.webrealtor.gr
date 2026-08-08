import mongoose from "mongoose";
import { TRANSACTION_TYPES } from "@/lib/types";
import type { IProperty } from "@/models/Property";
import type { IMediaImage } from "@/models/MediaImage";

// Not a route — a colocated helper shared by POST (route.ts) and PUT ([id]/route.ts) so ~90 fields
// aren't hand-mapped twice. Next's router only treats route.ts/page.tsx (etc.) as routable, so this
// file is invisible to it.

function toObjectId(value: unknown): mongoose.Types.ObjectId | null {
  return typeof value === "string" && value.trim() ? new mongoose.Types.ObjectId(value) : null;
}

function toOptionalNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toBool(value: unknown): boolean {
  return Boolean(value);
}

function toOptionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDescriptions(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [locale, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === "string" && text.trim()) out[locale] = text.trim();
  }
  return out;
}

// Images are managed on the dedicated media page (POST /api/uploads + PUT /api/properties/[id]/images),
// not this form — this just keeps whatever shape came back unchanged, dropping anything malformed.
function toImages(value: unknown): IMediaImage[] {
  if (!Array.isArray(value)) return [];
  const images: IMediaImage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { id, url } = item as Record<string, unknown>;
    if (typeof id !== "string" || !id || typeof url !== "string" || !url) continue;
    const { alt, description } = item as Record<string, unknown>;
    images.push({
      id,
      url,
      alt: typeof alt === "string" ? alt : "",
      description: typeof description === "string" ? description : "",
    });
  }
  return images;
}

export interface ParsedPropertyBody {
  errors: string[];
  data: Partial<IProperty>;
}

export function parsePropertyBody(body: Record<string, unknown>): ParsedPropertyBody {
  const errors: string[] = [];

  const price = toOptionalNumber(body.price);
  const area = toOptionalNumber(body.area);
  const propertyCategoryId = toObjectId(body.propertyCategoryId);
  const energyClassId = toObjectId(body.energyClassId);

  if (price === null) errors.push("Price is required");
  if (area === null) errors.push("Area is required");
  if (!propertyCategoryId) errors.push("Property category is required");
  if (!energyClassId) errors.push("Energy class is required");
  if (body.transactionType && !TRANSACTION_TYPES.includes(body.transactionType as never)) {
    errors.push("transactionType must be 'sale' or 'rent'");
  }

  const data: Partial<IProperty> = {
    clientId: toObjectId(body.clientId),
    title: typeof body.title === "string" ? body.title.trim() : "",
    status: body.status === "pending" || body.status === "inactive" ? body.status : "active",

    transactionType: body.transactionType === "rent" ? "rent" : "sale",
    currency: typeof body.currency === "string" && body.currency.trim() ? body.currency.trim() : "EUR",
    propertyCategoryId,
    isAuction: toBool(body.isAuction),
    price: price ?? 0,
    priceNegotiable: toBool(body.priceNegotiable),
    commonExpenses: toOptionalNumber(body.commonExpenses),
    area: area ?? 0,
    lotSize: toOptionalNumber(body.lotSize),
    availableFrom: toOptionalDate(body.availableFrom),
    isLeased: toBool(body.isLeased),
    publishedAt: toOptionalDate(body.publishedAt),

    floorLevelId: toObjectId(body.floorLevelId),
    isWholeFloorApartment: toBool(body.isWholeFloorApartment),
    levels: toOptionalNumber(body.levels),
    bedrooms: toOptionalNumber(body.bedrooms),
    kitchens: toOptionalNumber(body.kitchens),
    bathrooms: toOptionalNumber(body.bathrooms),
    wc: toOptionalNumber(body.wc),
    livingRooms: toOptionalNumber(body.livingRooms),
    hasStorage: toBool(body.hasStorage),
    storageArea: toOptionalNumber(body.storageArea),
    hasAttic: toBool(body.hasAttic),
    hasPlayroom: toBool(body.hasPlayroom),

    energyClassId,
    heatingSystemId: toObjectId(body.heatingSystemId),
    heatingMediumId: toObjectId(body.heatingMediumId),
    hasAC: toBool(body.hasAC),
    hasSolarHeater: toBool(body.hasSolarHeater),
    hasUnderfloorHeating: toBool(body.hasUnderfloorHeating),
    hasNightPower: toBool(body.hasNightPower),

    yearBuilt: toOptionalNumber(body.yearBuilt),
    isUnderConstruction: toBool(body.isUnderConstruction),
    isUnfinished: toBool(body.isUnfinished),
    buildingFloorsId: toObjectId(body.buildingFloorsId),
    hasElevator: toBool(body.hasElevator),
    hasInternalStairs: toBool(body.hasInternalStairs),
    isNeoclassic: toBool(body.isNeoclassic),
    renovationYear: toOptionalNumber(body.renovationYear),
    isRenovated: toBool(body.isRenovated),
    requiresRenovation: toBool(body.requiresRenovation),
    isPreserved: toBool(body.isPreserved),
    netArea: toOptionalNumber(body.netArea),
    grossArea: toOptionalNumber(body.grossArea),

    hasSecurityDoor: toBool(body.hasSecurityDoor),
    hasAlarm: toBool(body.hasAlarm),
    isPainted: toBool(body.isPainted),
    isFurnished: toBool(body.isFurnished),
    joineryTypeId: toObjectId(body.joineryTypeId),
    glassTypeId: toObjectId(body.glassTypeId),
    hasPestNet: toBool(body.hasPestNet),
    hasFireplace: toBool(body.hasFireplace),
    isBright: toBool(body.isBright),
    isAiry: toBool(body.isAiry),
    isLuxury: toBool(body.isLuxury),
    hasEvCharger: toBool(body.hasEvCharger),
    hasMannedReception: toBool(body.hasMannedReception),
    floorTypeId: toObjectId(body.floorTypeId),
    hasSatelliteDish: toBool(body.hasSatelliteDish),

    hasBalcony: toBool(body.hasBalcony),
    hasAwning: toBool(body.hasAwning),
    balconyArea: toOptionalNumber(body.balconyArea),
    hasBuiltInBBQ: toBool(body.hasBuiltInBBQ),
    hasGarden: toBool(body.hasGarden),
    gardenTypeId: toObjectId(body.gardenTypeId),
    hasPool: toBool(body.hasPool),
    hasView: toBool(body.hasView),
    orientationId: toObjectId(body.orientationId),
    isCorner: toBool(body.isCorner),
    isFacade: toBool(body.isFacade),
    zoningTypeId: toObjectId(body.zoningTypeId),
    isAccessibleForDisabled: toBool(body.isAccessibleForDisabled),
    isCaveBuilding: toBool(body.isCaveBuilding),
    roadAccessTypeId: toObjectId(body.roadAccessTypeId),
    distanceFromSea: toOptionalNumber(body.distanceFromSea),
    hasParking: toBool(body.hasParking),

    suitableForStudents: toBool(body.suitableForStudents),
    suitableForHoliday: toBool(body.suitableForHoliday),
    suitableForCommercialUse: toBool(body.suitableForCommercialUse),
    suitableForShortTermLetting: toBool(body.suitableForShortTermLetting),
    suitableForMedicalOffice: toBool(body.suitableForMedicalOffice),
    suitableForInvestment: toBool(body.suitableForInvestment),

    descriptions: toDescriptions(body.descriptions) as unknown as Map<string, string>,

    country: typeof body.country === "string" ? body.country.trim() : "",
    region: typeof body.region === "string" ? body.region.trim() : "",
    municipality: typeof body.municipality === "string" ? body.municipality.trim() : "",
    neighborhood: typeof body.neighborhood === "string" ? body.neighborhood.trim() : "",
    city: typeof body.city === "string" ? body.city.trim() : "",
    address: typeof body.address === "string" ? body.address.trim() : "",
    postcode: typeof body.postcode === "string" ? body.postcode.trim() : "",
    latitude: toOptionalNumber(body.latitude),
    longitude: toOptionalNumber(body.longitude),
    googleMapsUrl: typeof body.googleMapsUrl === "string" ? body.googleMapsUrl.trim() : "",

    images: toImages(body.images),
  };

  return { errors, data };
}
