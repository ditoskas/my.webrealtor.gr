import mongoose, { Schema, Document, Model } from "mongoose";
import {
  NOTE_ENTITY_TYPES,
  NOTE_IMPORTANCE_LEVELS,
  type NoteEntityType,
  type NoteImportance,
} from "@/lib/types";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface INote extends Document {
  entityType: NoteEntityType;
  entityId: mongoose.Types.ObjectId;
  title: string;
  text: string;
  importance: NoteImportance;
  userId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

type INoteModel = Model<INote>;

const noteSchema = new Schema<INote, INoteModel>(
  {
    entityType: { type: String, enum: NOTE_ENTITY_TYPES, required: true },
    // No `ref` — entityId points at one of four different collections depending on entityType,
    // and is never .populate()'d (same convention as PriceHistory.listingId).
    entityId: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    importance: { type: String, enum: NOTE_IMPORTANCE_LEVELS, default: "Normal", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  baseSchemaOptions
);

noteSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const Note =
  (mongoose.models.Note as INoteModel) || mongoose.model<INote, INoteModel>("Note", noteSchema);
