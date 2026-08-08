import mongoose, { Schema, Document, Model } from "mongoose";
import {
  TRANSACTION_TYPES,
  INTEREST_FOR_LISTING_TYPES,
  type TransactionType,
  type InterestForListingType,
} from "@/lib/types";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IInterestFor extends Document {
  clientId: mongoose.Types.ObjectId;
  date: Date;
  transactionType: TransactionType;
  listingType: InterestForListingType;
  categoryId: mongoose.Types.ObjectId;
  price: number;
  city?: string;
  area?: number | null;
  remarks?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type IInterestForModel = Model<IInterestFor>;

const interestForSchema = new Schema<IInterestFor, IInterestForModel>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    transactionType: { type: String, enum: TRANSACTION_TYPES, required: true },
    listingType: { type: String, enum: INTEREST_FOR_LISTING_TYPES, required: true },
    // No `ref` — categoryId points at PropertyCategory or LandCategory depending on listingType,
    // never .populate()'d, same convention as Note.entityId.
    categoryId: { type: Schema.Types.ObjectId, required: true },
    price: { type: Number, required: true },
    city: { type: String, trim: true },
    area: { type: Number, default: null },
    remarks: { type: String, trim: true },
    isActive: { type: Boolean, default: true, required: true },
  },
  baseSchemaOptions
);

interestForSchema.index({ clientId: 1, date: -1 });

export const InterestFor =
  (mongoose.models.InterestFor as IInterestForModel) ||
  mongoose.model<IInterestFor, IInterestForModel>("InterestFor", interestForSchema);
