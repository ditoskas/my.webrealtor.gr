import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IHeatingSystem extends Document {
  name: string;
  slug: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type IHeatingSystemModel = Model<IHeatingSystem>;

const heatingSystemSchema = new Schema<IHeatingSystem, IHeatingSystemModel>(
  {
    name: { type: String, required: true, trim: true },
    // unique: true both enforces uniqueness and creates the index — slug is the stable machine
    // identifier for this entity, name is just the display label.
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions
);

export const HeatingSystem =
  (mongoose.models.HeatingSystem as IHeatingSystemModel) ||
  mongoose.model<IHeatingSystem, IHeatingSystemModel>("HeatingSystem", heatingSystemSchema);
