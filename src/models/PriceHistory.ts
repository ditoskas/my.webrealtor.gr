import mongoose, { Schema, Document, Model } from "mongoose";
import { PRICE_HISTORY_LISTING_TYPES, type PriceHistoryListingType } from "@/lib/types";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IPriceHistory extends Document {
  listingId: mongoose.Types.ObjectId;
  listingType: PriceHistoryListingType;
  price: number;
  currency: string;
  userId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

type IPriceHistoryModel = Model<IPriceHistory>;

const priceHistorySchema = new Schema<IPriceHistory, IPriceHistoryModel>(
  {
    // No `ref` — listingId points at either Property or Land depending on listingType, and this
    // is never .populate()'d (same "resolve client-side" convention as LogEntry's userId/realtorId).
    listingId: { type: Schema.Types.ObjectId, required: true },
    listingType: { type: String, enum: PRICE_HISTORY_LISTING_TYPES, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "EUR" },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  baseSchemaOptions
);

priceHistorySchema.index({ listingId: 1, listingType: 1, createdAt: -1 });

export const PriceHistory =
  (mongoose.models.PriceHistory as IPriceHistoryModel) ||
  mongoose.model<IPriceHistory, IPriceHistoryModel>("PriceHistory", priceHistorySchema);
