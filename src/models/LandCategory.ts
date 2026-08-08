import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface ILandCategory extends Document {
  name: string;
  slug: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type ILandCategoryModel = Model<ILandCategory>;

const landCategorySchema = new Schema<ILandCategory, ILandCategoryModel>(
  {
    name: { type: String, required: true, trim: true },
    // unique: true both enforces uniqueness and creates the index — slug is the stable machine
    // identifier for this entity, name is just the display label.
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions
);

export const LandCategory =
  (mongoose.models.LandCategory as ILandCategoryModel) ||
  mongoose.model<ILandCategory, ILandCategoryModel>("LandCategory", landCategorySchema);
