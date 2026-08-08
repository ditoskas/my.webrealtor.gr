import mongoose, { Schema, Document, Model } from "mongoose";
import type { PropertyStatus, TransactionType } from "@/lib/types";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";
import { TRANSACTION_TYPES } from "@/lib/types";
import { mediaImageSchema, type IMediaImage } from "./MediaImage";

const PROPERTY_STATUSES: PropertyStatus[] = ["active", "pending", "inactive"];

// Field groups and *Id refs mirror CLAUDE.md → "Property management" 1:1 — that doc is the source
// of truth for *why* each field exists (it was reverse-engineered from a competing portal's
// property-edit form), this file is just the mechanical Mongoose translation of it.
export interface IProperty extends Document {
  realtorId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId | null;

  title?: string;
  status: PropertyStatus;

  // Basic info
  transactionType: TransactionType;
  currency: string;
  propertyCategoryId?: mongoose.Types.ObjectId | null;
  isAuction: boolean;
  price: number;
  priceNegotiable: boolean;
  commonExpenses?: number | null;
  area: number;
  lotSize?: number | null;
  availableFrom?: Date | null;
  isLeased: boolean;
  publishedAt?: Date | null;

  // Property description (physical layout)
  floorLevelId?: mongoose.Types.ObjectId | null;
  isWholeFloorApartment: boolean;
  levels?: number | null;
  bedrooms?: number | null;
  kitchens?: number | null;
  bathrooms?: number | null;
  wc?: number | null;
  livingRooms?: number | null;
  hasStorage: boolean;
  storageArea?: number | null;
  hasAttic: boolean;
  hasPlayroom: boolean;

  // Heating & consumption
  energyClassId?: mongoose.Types.ObjectId | null;
  heatingSystemId?: mongoose.Types.ObjectId | null;
  heatingMediumId?: mongoose.Types.ObjectId | null;
  hasAC: boolean;
  hasSolarHeater: boolean;
  hasUnderfloorHeating: boolean;
  hasNightPower: boolean;

  // Construction
  yearBuilt?: number | null;
  isUnderConstruction: boolean;
  isUnfinished: boolean;
  buildingFloorsId?: mongoose.Types.ObjectId | null;
  hasElevator: boolean;
  hasInternalStairs: boolean;
  isNeoclassic: boolean;
  renovationYear?: number | null;
  isRenovated: boolean;
  requiresRenovation: boolean;
  isPreserved: boolean;
  netArea?: number | null;
  grossArea?: number | null;

  // Technical features & interior
  hasSecurityDoor: boolean;
  hasAlarm: boolean;
  isPainted: boolean;
  isFurnished: boolean;
  joineryTypeId?: mongoose.Types.ObjectId | null;
  glassTypeId?: mongoose.Types.ObjectId | null;
  hasPestNet: boolean;
  hasFireplace: boolean;
  isBright: boolean;
  isAiry: boolean;
  isLuxury: boolean;
  hasEvCharger: boolean;
  hasMannedReception: boolean;
  floorTypeId?: mongoose.Types.ObjectId | null;
  hasSatelliteDish: boolean;

  // Outdoor spaces & location on plot
  hasBalcony: boolean;
  hasAwning: boolean;
  balconyArea?: number | null;
  hasBuiltInBBQ: boolean;
  hasGarden: boolean;
  gardenTypeId?: mongoose.Types.ObjectId | null;
  hasPool: boolean;
  hasView: boolean;
  orientationId?: mongoose.Types.ObjectId | null;
  isCorner: boolean;
  isFacade: boolean;
  zoningTypeId?: mongoose.Types.ObjectId | null;
  isAccessibleForDisabled: boolean;
  isCaveBuilding: boolean;
  roadAccessTypeId?: mongoose.Types.ObjectId | null;
  distanceFromSea?: number | null;
  hasParking: boolean;

  // Suitable for
  suitableForStudents: boolean;
  suitableForHoliday: boolean;
  suitableForCommercialUse: boolean;
  suitableForShortTermLetting: boolean;
  suitableForMedicalOffice: boolean;
  suitableForInvestment: boolean;

  // Description — per-locale, e.g. { el: "...", en: "..." }. Only "el" has a UI input so far.
  descriptions: Map<string, string>;

  // Location
  country?: string;
  region?: string;
  municipality?: string;
  neighborhood?: string;
  city?: string;
  address?: string;
  postcode?: string;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string;

  // Media
  images: IMediaImage[];

  createdAt: Date;
  updatedAt: Date;
}

type IPropertyModel = Model<IProperty>;

const propertySchema = new Schema<IProperty, IPropertyModel>(
  {
    realtorId: { type: Schema.Types.ObjectId, ref: "Realtor", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },

    title: { type: String, default: "" },
    status: { type: String, enum: PROPERTY_STATUSES, default: "active", required: true },

    // Basic info
    transactionType: { type: String, enum: TRANSACTION_TYPES, default: "sale", required: true },
    currency: { type: String, default: "EUR" },
    propertyCategoryId: { type: Schema.Types.ObjectId, ref: "PropertyCategory", default: null },
    isAuction: { type: Boolean, default: false },
    price: { type: Number, required: true, min: 0 },
    priceNegotiable: { type: Boolean, default: false },
    commonExpenses: { type: Number, default: null },
    area: { type: Number, required: true, min: 0 },
    lotSize: { type: Number, default: null },
    availableFrom: { type: Date, default: null },
    isLeased: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },

    // Property description (physical layout)
    floorLevelId: { type: Schema.Types.ObjectId, ref: "FloorLevel", default: null },
    isWholeFloorApartment: { type: Boolean, default: false },
    levels: { type: Number, default: null },
    bedrooms: { type: Number, default: null },
    kitchens: { type: Number, default: null },
    bathrooms: { type: Number, default: null },
    wc: { type: Number, default: null },
    livingRooms: { type: Number, default: null },
    hasStorage: { type: Boolean, default: false },
    storageArea: { type: Number, default: null },
    hasAttic: { type: Boolean, default: false },
    hasPlayroom: { type: Boolean, default: false },

    // Heating & consumption
    energyClassId: { type: Schema.Types.ObjectId, ref: "EnergyClass", default: null },
    heatingSystemId: { type: Schema.Types.ObjectId, ref: "HeatingSystem", default: null },
    heatingMediumId: { type: Schema.Types.ObjectId, ref: "HeatingMedium", default: null },
    hasAC: { type: Boolean, default: false },
    hasSolarHeater: { type: Boolean, default: false },
    hasUnderfloorHeating: { type: Boolean, default: false },
    hasNightPower: { type: Boolean, default: false },

    // Construction
    yearBuilt: { type: Number, default: null },
    isUnderConstruction: { type: Boolean, default: false },
    isUnfinished: { type: Boolean, default: false },
    buildingFloorsId: { type: Schema.Types.ObjectId, ref: "BuildingFloors", default: null },
    hasElevator: { type: Boolean, default: false },
    hasInternalStairs: { type: Boolean, default: false },
    isNeoclassic: { type: Boolean, default: false },
    renovationYear: { type: Number, default: null },
    isRenovated: { type: Boolean, default: false },
    requiresRenovation: { type: Boolean, default: false },
    isPreserved: { type: Boolean, default: false },
    netArea: { type: Number, default: null },
    grossArea: { type: Number, default: null },

    // Technical features & interior
    hasSecurityDoor: { type: Boolean, default: false },
    hasAlarm: { type: Boolean, default: false },
    isPainted: { type: Boolean, default: false },
    isFurnished: { type: Boolean, default: false },
    joineryTypeId: { type: Schema.Types.ObjectId, ref: "JoineryType", default: null },
    glassTypeId: { type: Schema.Types.ObjectId, ref: "GlassType", default: null },
    hasPestNet: { type: Boolean, default: false },
    hasFireplace: { type: Boolean, default: false },
    isBright: { type: Boolean, default: false },
    isAiry: { type: Boolean, default: false },
    isLuxury: { type: Boolean, default: false },
    hasEvCharger: { type: Boolean, default: false },
    hasMannedReception: { type: Boolean, default: false },
    floorTypeId: { type: Schema.Types.ObjectId, ref: "FloorType", default: null },
    hasSatelliteDish: { type: Boolean, default: false },

    // Outdoor spaces & location on plot
    hasBalcony: { type: Boolean, default: false },
    hasAwning: { type: Boolean, default: false },
    balconyArea: { type: Number, default: null },
    hasBuiltInBBQ: { type: Boolean, default: false },
    hasGarden: { type: Boolean, default: false },
    gardenTypeId: { type: Schema.Types.ObjectId, ref: "GardenType", default: null },
    hasPool: { type: Boolean, default: false },
    hasView: { type: Boolean, default: false },
    orientationId: { type: Schema.Types.ObjectId, ref: "Orientation", default: null },
    isCorner: { type: Boolean, default: false },
    isFacade: { type: Boolean, default: false },
    zoningTypeId: { type: Schema.Types.ObjectId, ref: "ZoningType", default: null },
    isAccessibleForDisabled: { type: Boolean, default: false },
    isCaveBuilding: { type: Boolean, default: false },
    roadAccessTypeId: { type: Schema.Types.ObjectId, ref: "RoadAccessType", default: null },
    distanceFromSea: { type: Number, default: null },
    hasParking: { type: Boolean, default: false },

    // Suitable for
    suitableForStudents: { type: Boolean, default: false },
    suitableForHoliday: { type: Boolean, default: false },
    suitableForCommercialUse: { type: Boolean, default: false },
    suitableForShortTermLetting: { type: Boolean, default: false },
    suitableForMedicalOffice: { type: Boolean, default: false },
    suitableForInvestment: { type: Boolean, default: false },

    // Description
    descriptions: { type: Map, of: String, default: {} },

    // Location
    country: { type: String, default: "" },
    region: { type: String, default: "" },
    municipality: { type: String, default: "" },
    neighborhood: { type: String, default: "" },
    city: { type: String, default: "" },
    address: { type: String, default: "" },
    postcode: { type: String, default: "" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    googleMapsUrl: { type: String, default: "" },

    // Media
    images: { type: [mediaImageSchema], default: [] },
  },
  baseSchemaOptions
);

export const Property =
  (mongoose.models.Property as IPropertyModel) ||
  mongoose.model<IProperty, IPropertyModel>("Property", propertySchema);
