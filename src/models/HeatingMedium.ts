import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IHeatingMedium extends Document {
  name: string;
  slug: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type IHeatingMediumModel = Model<IHeatingMedium>;

const heatingMediumSchema = new Schema<IHeatingMedium, IHeatingMediumModel>(
  {
    name: { type: String, required: true, trim: true },
    // unique: true both enforces uniqueness and creates the index — slug is the stable machine
    // identifier for this entity, name is just the display label.
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions
);

export const HeatingMedium =
  (mongoose.models.HeatingMedium as IHeatingMediumModel) ||
  mongoose.model<IHeatingMedium, IHeatingMediumModel>("HeatingMedium", heatingMediumSchema);
