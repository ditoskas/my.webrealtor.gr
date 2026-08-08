import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface ISlope extends Document {
  name: string;
  slug: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type ISlopeModel = Model<ISlope>;

const slopeSchema = new Schema<ISlope, ISlopeModel>(
  {
    name: { type: String, required: true, trim: true },
    // unique: true both enforces uniqueness and creates the index — slug is the stable machine
    // identifier for this entity, name is just the display label.
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions
);

export const Slope =
  (mongoose.models.Slope as ISlopeModel) ||
  mongoose.model<ISlope, ISlopeModel>("Slope", slopeSchema);
