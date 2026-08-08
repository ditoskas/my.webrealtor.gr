import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

// A signup that hasn't been confirmed yet — one row per in-flight "email + password, no realtor
// info yet" registration. Deliberately NOT a User: the User schema's pre("validate") hook
// requires Administrator/Operator to already have a realtorId (see models/User.ts), which
// doesn't exist until the confirmation step creates it. See CLAUDE.md → "Registration".
export interface IPendingRegistration extends Document {
  email: string;
  passwordHash: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

type IPendingRegistrationModel = Model<IPendingRegistration>;

const pendingRegistrationSchema = new Schema<IPendingRegistration, IPendingRegistrationModel>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  baseSchemaOptions
);

export const PendingRegistration =
  (mongoose.models.PendingRegistration as IPendingRegistrationModel) ||
  mongoose.model<IPendingRegistration, IPendingRegistrationModel>(
    "PendingRegistration",
    pendingRegistrationSchema
  );
