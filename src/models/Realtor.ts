import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IRealtor extends Document {
  userId?: mongoose.Types.ObjectId | null;
  firstName: string;
  lastName: string;
  phone: string;
  mobile: string;
  email: string;
  city: string;
  address: string;
  postcode: string;
  googleMapsUrl: string;
  website: string;
  // Business registration number (e.g. Greek ΓΕΜΗ), printed on the Order (Εντολή) tool's "Αριθμός"
  // line — see CLAUDE.md → "Order tool" and components/tools/OrderPage.tsx.
  realtorNumber: string;
  // Commission rates as a fraction of price (e.g. 0.1 = 10%), applied to Transaction.price when
  // auto-filling TransactionForm's commission field — saleCommission for a "buy" action,
  // rentCommission for a "rent" action (see CLAUDE.md → "Realtor commission rates"). Nullable:
  // an unset rate simply skips auto-fill, commission stays manually entered.
  saleCommission?: number | null;
  rentCommission?: number | null;
  // Profile photo — uploaded/replaced via POST /api/realtors/[id]/image (not this model's own
  // generic PUT, so a PUT that omits this field never clears it, same as userId). Used on the
  // Receipt tool when the selected transaction's realtor has one — see components/tools/ReceiptPage.
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type IRealtorModel = Model<IRealtor>;

const realtorSchema = new Schema<IRealtor, IRealtorModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    mobile: { type: String, default: "" },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    city: { type: String, default: "" },
    address: { type: String, default: "" },
    postcode: { type: String, default: "" },
    googleMapsUrl: { type: String, default: "" },
    website: { type: String, default: "" },
    realtorNumber: { type: String, default: "" },
    saleCommission: { type: Number, default: null, min: 0 },
    rentCommission: { type: Number, default: null, min: 0 },
    imageUrl: { type: String, default: null },
  },
  baseSchemaOptions
);

export const Realtor =
  (mongoose.models.Realtor as IRealtorModel) ||
  mongoose.model<IRealtor, IRealtorModel>("Realtor", realtorSchema);
