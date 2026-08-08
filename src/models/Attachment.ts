import mongoose, { Schema, Document, Model } from "mongoose";
import { ATTACHABLE_ENTITY_TYPES, type AttachableEntityType } from "@/lib/types";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IAttachment extends Document {
  entityType: AttachableEntityType;
  entityId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  userId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

type IAttachmentModel = Model<IAttachment>;

const attachmentSchema = new Schema<IAttachment, IAttachmentModel>(
  {
    entityType: { type: String, enum: ATTACHABLE_ENTITY_TYPES, required: true },
    // No `ref` — entityId points at one of four different collections depending on entityType,
    // and is never .populate()'d (same convention as Note.entityId / PriceHistory.listingId).
    entityId: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  baseSchemaOptions
);

attachmentSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const Attachment =
  (mongoose.models.Attachment as IAttachmentModel) ||
  mongoose.model<IAttachment, IAttachmentModel>("Attachment", attachmentSchema);
