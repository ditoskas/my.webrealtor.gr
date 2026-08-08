import mongoose, { Schema, Document, Model } from "mongoose";
import {
  INTEREST_FOR_LISTING_TYPES,
  TRANSACTION_ACTIONS,
  type InterestForListingType,
  type TransactionAction,
} from "@/lib/types";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface ITransaction extends Document {
  realtorId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  date: Date;
  listingType: InterestForListingType;
  listingId: mongoose.Types.ObjectId;
  action: TransactionAction;
  price: number;
  commission: number;
  tax: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

type ITransactionModel = Model<ITransaction>;

const transactionSchema = new Schema<ITransaction, ITransactionModel>(
  {
    realtorId: { type: Schema.Types.ObjectId, ref: "Realtor", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    listingType: { type: String, enum: INTEREST_FOR_LISTING_TYPES, required: true },
    // No `ref` — listingId points at Property or Land depending on listingType, never
    // .populate()'d, same convention as Viewing.listingId/Note.entityId.
    listingId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, enum: TRANSACTION_ACTIONS, required: true },
    price: { type: Number, required: true },
    commission: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    comment: { type: String, default: "" },
  },
  baseSchemaOptions
);

transactionSchema.index({ realtorId: 1, date: -1 });

export const Transaction =
  (mongoose.models.Transaction as ITransactionModel) ||
  mongoose.model<ITransaction, ITransactionModel>("Transaction", transactionSchema);
