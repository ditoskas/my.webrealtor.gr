import mongoose, { Schema, Document, Model } from "mongoose";
import { INTEREST_FOR_LISTING_TYPES, type InterestForListingType } from "@/lib/types";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IViewing extends Document {
  clientId: mongoose.Types.ObjectId;
  date: Date;
  listingType: InterestForListingType;
  listingId: mongoose.Types.ObjectId;
  comment?: string;
  signatureDocumentId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

type IViewingModel = Model<IViewing>;

const viewingSchema = new Schema<IViewing, IViewingModel>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    date: { type: Date, required: true },
    listingType: { type: String, enum: INTEREST_FOR_LISTING_TYPES, required: true },
    // No `ref` — listingId points at Property or Land depending on listingType, never
    // .populate()'d, same convention as Note.entityId/PriceHistory.listingId.
    listingId: { type: Schema.Types.ObjectId, required: true },
    comment: { type: String, trim: true },
    // Fixed target type (always Attachment), unlike listingId above, so a real `ref` applies here
    // even though it's never .populate()'d either — same as Property/Land's own clientId ref.
    signatureDocumentId: { type: Schema.Types.ObjectId, ref: "Attachment", default: null },
  },
  baseSchemaOptions
);

viewingSchema.index({ clientId: 1, date: -1 });

export const Viewing =
  (mongoose.models.Viewing as IViewingModel) ||
  mongoose.model<IViewing, IViewingModel>("Viewing", viewingSchema);
