import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IRoadAccessType extends Document {
  name: string;
  slug: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type IRoadAccessTypeModel = Model<IRoadAccessType>;

const roadAccessTypeSchema = new Schema<IRoadAccessType, IRoadAccessTypeModel>(
  {
    name: { type: String, required: true, trim: true },
    // unique: true both enforces uniqueness and creates the index — slug is the stable machine
    // identifier for this entity, name is just the display label.
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions
);

export const RoadAccessType =
  (mongoose.models.RoadAccessType as IRoadAccessTypeModel) ||
  mongoose.model<IRoadAccessType, IRoadAccessTypeModel>("RoadAccessType", roadAccessTypeSchema);
