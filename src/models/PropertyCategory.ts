import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IPropertyCategory extends Document {
  name: string;
  slug: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type IPropertyCategoryModel = Model<IPropertyCategory>;

const propertyCategorySchema = new Schema<IPropertyCategory, IPropertyCategoryModel>(
  {
    name: { type: String, required: true, trim: true },
    // unique: true both enforces uniqueness and creates the index — slug is the stable machine
    // identifier for this entity, name is just the display label.
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions
);

export const PropertyCategory =
  (mongoose.models.PropertyCategory as IPropertyCategoryModel) ||
  mongoose.model<IPropertyCategory, IPropertyCategoryModel>("PropertyCategory", propertyCategorySchema);
