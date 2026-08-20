import mongoose from "mongoose";
import { TRANSACTION_TYPES } from "@/lib/types";
import type { IAsset } from "@/models/Asset";
import type { IMediaImage } from "@/models/MediaImage";

// Not a route — a colocated helper shared by POST (route.ts) and PUT ([id]/route.ts), merging the
// old parsePropertyBody.ts + parseLandBody.ts into one (the two field sets union cleanly onto
// IAsset, see models/Asset.ts). Next's router only treats route.ts/page.tsx (etc.) as routable, so
// this file is invisible to it.

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

// Images are managed on the dedicated media page (POST /api/uploads + PUT /api/assets/[id]/images),
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

// The plot boundary polygon, drawn on the Location map — silently drops any point missing a
// finite lat/lng, same "trust the UI, validate the shape" discipline as toImages/toTagIds below.
function toBoundary(value: unknown): { lat: number; lng: number }[] {
  if (!Array.isArray(value)) return [];
  const points: { lat: number; lng: number }[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { lat, lng } = item as Record<string, unknown>;
    const latNum = typeof lat === "number" ? lat : Number(lat);
    const lngNum = typeof lng === "number" ? lng : Number(lng);
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) points.push({ lat: latNum, lng: lngNum });
  }
  return points;
}

// Tags are managed on Profile, referenced here by id only — this just keeps whatever array of
// valid-looking ObjectId strings came back, silently dropping anything malformed (same "trust the
// UI, validate the shape" discipline as toImages above). Not cross-checked against the realtor's
// actual tag set here; the UI only ever offers a realtor's own already-fetched tags to pick from.
function toTagIds(value: unknown): mongoose.Types.ObjectId[] {
  if (!Array.isArray(value)) return [];
  const ids: mongoose.Types.ObjectId[] = [];
  for (const item of value) {
    const id = toObjectId(item);
    if (id) ids.push(id);
  }
  return ids;
}

export interface ParsedAssetBody {
  errors: string[];
  data: Partial<IAsset>;
}

export function parseAssetBody(body: Record<string, unknown>): ParsedAssetBody {
  const errors: string[] = [];

  const isLand = toBool(body.isLand);
  const price = toOptionalNumber(body.price);
  const area = toOptionalNumber(body.area);
  const propertyCategoryId = toObjectId(body.propertyCategoryId);
  const landCategoryId = toObjectId(body.landCategoryId);
  const energyClassId = toObjectId(body.energyClassId);

  if (price === null) errors.push("Price is required");
  if (area === null) errors.push("Area is required");
  if (body.transactionType && !TRANSACTION_TYPES.includes(body.transactionType as never)) {
    errors.push("transactionType must be 'sale' or 'rent'");
  }
  if (isLand) {
    if (!landCategoryId) errors.push("Land category is required");
  } else {
    if (!propertyCategoryId) errors.push("Property category is required");
    if (!energyClassId) errors.push("Energy class is required");
  }

  const data: Partial<IAsset> = {
    clientId: toObjectId(body.clientId),
    isLand,
    title: typeof body.title === "string" ? body.title.trim() : "",
    status: body.status === "pending" || body.status === "inactive" ? body.status : "active",

    // Basic info
    transactionType: body.transactionType === "rent" ? "rent" : "sale",
    currency: typeof body.currency === "string" && body.currency.trim() ? body.currency.trim() : "EUR",
    propertyCategoryId,
    landCategoryId,
    isAuction: toBool(body.isAuction),
    price: price ?? 0,
    priceNegotiable: toBool(body.priceNegotiable),
    commonExpenses: toOptionalNumber(body.commonExpenses),
    area: area ?? 0,
    lotSize: toOptionalNumber(body.lotSize),
    isBuildable: toBool(body.isBuildable),
    availableFrom: toOptionalDate(body.availableFrom),
    isLeased: toBool(body.isLeased),
    publishedAt: toOptionalDate(body.publishedAt),

    // Property description (physical layout)
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

    // Heating & consumption
    energyClassId,
    heatingSystemId: toObjectId(body.heatingSystemId),
    heatingMediumId: toObjectId(body.heatingMediumId),
    hasAC: toBool(body.hasAC),
    hasSolarHeater: toBool(body.hasSolarHeater),
    hasUnderfloorHeating: toBool(body.hasUnderfloorHeating),
    hasNightPower: toBool(body.hasNightPower),

    // Construction
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

    // Technical features & interior
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

    // Outdoor spaces & location on plot
    hasBalcony: toBool(body.hasBalcony),
    hasAwning: toBool(body.hasAwning),
    balconyArea: toOptionalNumber(body.balconyArea),
    hasBuiltInBBQ: toBool(body.hasBuiltInBBQ),
    hasGarden: toBool(body.hasGarden),
    gardenTypeId: toObjectId(body.gardenTypeId),
    hasPool: toBool(body.hasPool),
    hasView: toBool(body.hasView),
    isWithinSettlement: toBool(body.isWithinSettlement),
    orientationId: toObjectId(body.orientationId),
    isCorner: toBool(body.isCorner),
    isFacade: toBool(body.isFacade),
    zoningTypeId: toObjectId(body.zoningTypeId),
    facadeLength: toOptionalNumber(body.facadeLength),
    isAccessibleForDisabled: toBool(body.isAccessibleForDisabled),
    isCaveBuilding: toBool(body.isCaveBuilding),
    roadAccessTypeId: toObjectId(body.roadAccessTypeId),
    distanceFromSea: toOptionalNumber(body.distanceFromSea),
    hasParking: toBool(body.hasParking),
    slopeId: toObjectId(body.slopeId),
    coverageRatio: toOptionalNumber(body.coverageRatio),
    buildingCoefficient: toOptionalNumber(body.buildingCoefficient),
    isAntiparoxi: toBool(body.isAntiparoxi),
    isWithinCityPlan: toBool(body.isWithinCityPlan),

    // Suitable for
    suitableForStudents: toBool(body.suitableForStudents),
    suitableForHoliday: toBool(body.suitableForHoliday),
    suitableForCommercialUse: toBool(body.suitableForCommercialUse),
    suitableForShortTermLetting: toBool(body.suitableForShortTermLetting),
    suitableForMedicalOffice: toBool(body.suitableForMedicalOffice),
    suitableForInvestment: toBool(body.suitableForInvestment),
    suitableForAgriculturalUse: toBool(body.suitableForAgriculturalUse),

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
    boundary: toBoundary(body.boundary),

    images: toImages(body.images),

    tagIds: toTagIds(body.tagIds),
  };

  return { errors, data };
}
