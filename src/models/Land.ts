import mongoose, { Schema, Document, Model } from "mongoose";
import type { PropertyStatus, TransactionType } from "@/lib/types";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";
import { TRANSACTION_TYPES } from "@/lib/types";
import { mediaImageSchema, type IMediaImage } from "./MediaImage";

const LAND_STATUSES: PropertyStatus[] = ["active", "pending", "inactive"];

// Field groups and *Id refs mirror CLAUDE.md → "Land management" 1:1 — reverse-engineered from a
// competing portal's land-listing edit form the same way Property.ts was. Land is a distinct
// entity from Property (not an extension of it) since a plot listing has a much smaller field set
// (no bedrooms/heating/construction) — see CLAUDE.md for the full field-by-field provenance.
export interface ILand extends Document {
  realtorId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId | null;

  title?: string;
  status: PropertyStatus;

  // Basic info
  transactionType: TransactionType;
  currency: string;
  landCategoryId?: mongoose.Types.ObjectId | null;
  isAuction: boolean;
  price: number;
  priceNegotiable: boolean;
  area: number;
  isBuildable: boolean;
  availableFrom?: Date | null;

  // Outdoor spaces & location on plot
  hasView: boolean;
  isWithinSettlement: boolean;
  orientationId?: mongoose.Types.ObjectId | null;
  isCorner: boolean;
  isFacade: boolean;
  zoningTypeId?: mongoose.Types.ObjectId | null;
  facadeLength?: number | null;
  distanceFromSea?: number | null;
  slopeId?: mongoose.Types.ObjectId | null;
  suitableForInvestment: boolean;
  suitableForAgriculturalUse: boolean;
  roadAccessTypeId?: mongoose.Types.ObjectId | null;
  coverageRatio?: number | null;
  buildingCoefficient?: number | null;
  isAntiparoxi: boolean;
  isWithinCityPlan: boolean;

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

type ILandModel = Model<ILand>;

const landSchema = new Schema<ILand, ILandModel>(
  {
    realtorId: { type: Schema.Types.ObjectId, ref: "Realtor", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },

    title: { type: String, default: "" },
    status: { type: String, enum: LAND_STATUSES, default: "active", required: true },

    // Basic info
    transactionType: { type: String, enum: TRANSACTION_TYPES, default: "sale", required: true },
    currency: { type: String, default: "EUR" },
    landCategoryId: { type: Schema.Types.ObjectId, ref: "LandCategory", default: null },
    isAuction: { type: Boolean, default: false },
    price: { type: Number, required: true, min: 0 },
    priceNegotiable: { type: Boolean, default: false },
    area: { type: Number, required: true, min: 0 },
    isBuildable: { type: Boolean, default: false },
    availableFrom: { type: Date, default: null },

    // Outdoor spaces & location on plot
    hasView: { type: Boolean, default: false },
    isWithinSettlement: { type: Boolean, default: false },
    orientationId: { type: Schema.Types.ObjectId, ref: "Orientation", default: null },
    isCorner: { type: Boolean, default: false },
    isFacade: { type: Boolean, default: false },
    zoningTypeId: { type: Schema.Types.ObjectId, ref: "ZoningType", default: null },
    facadeLength: { type: Number, default: null },
    distanceFromSea: { type: Number, default: null },
    slopeId: { type: Schema.Types.ObjectId, ref: "Slope", default: null },
    suitableForInvestment: { type: Boolean, default: false },
    suitableForAgriculturalUse: { type: Boolean, default: false },
    roadAccessTypeId: { type: Schema.Types.ObjectId, ref: "RoadAccessType", default: null },
    coverageRatio: { type: Number, default: null },
    buildingCoefficient: { type: Number, default: null },
    isAntiparoxi: { type: Boolean, default: false },
    isWithinCityPlan: { type: Boolean, default: false },

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

export const Land =
  (mongoose.models.Land as ILandModel) || mongoose.model<ILand, ILandModel>("Land", landSchema);
