import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IEnergyClass extends Document {
  name: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type IEnergyClassModel = Model<IEnergyClass>;

const energyClassSchema = new Schema<IEnergyClass, IEnergyClassModel>(
  {
    name: { type: String, required: true, trim: true },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions
);

export const EnergyClass =
  (mongoose.models.EnergyClass as IEnergyClassModel) ||
  mongoose.model<IEnergyClass, IEnergyClassModel>("EnergyClass", energyClassSchema);
