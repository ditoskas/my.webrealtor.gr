import mongoose, { Schema, Document, Model } from "mongoose";
import { GENDERS, type Gender } from "@/lib/types";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IClient extends Document {
  realtorId: mongoose.Types.ObjectId;
  gender?: Gender | null;
  firstName: string;
  lastName: string;
  tin?: string;
  city?: string;
  address?: string;
  zipcode?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  createdAt: Date;
  updatedAt: Date;
}

type IClientModel = Model<IClient>;

const clientSchema = new Schema<IClient, IClientModel>(
  {
    realtorId: { type: Schema.Types.ObjectId, ref: "Realtor", required: true },
    gender: { type: String, enum: GENDERS, default: null },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    tin: { type: String, default: "", trim: true },
    city: { type: String, default: "" },
    address: { type: String, default: "" },
    zipcode: { type: String, default: "" },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "" },
    mobile: { type: String, default: "" },
  },
  baseSchemaOptions
);

export const Client =
  (mongoose.models.Client as IClientModel) ||
  mongoose.model<IClient, IClientModel>("Client", clientSchema);
