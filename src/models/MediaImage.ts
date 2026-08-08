import { Schema } from "mongoose";

// Shared subdocument shape for Property.images / Land.images — a listing photo with its own
// stable id (assigned at upload time, not Mongoose's auto _id) plus alt text / caption. `_id:
// false` keeps subdocuments from getting an extra _id field alongside our own `id`, matching the
// id-based shape the rest of the API already exposes (see lib/mongooseSchemaOptions.ts).
export interface IMediaImage {
  id: string;
  url: string;
  alt: string;
  description: string;
}

export const mediaImageSchema = new Schema<IMediaImage>(
  {
    id: { type: String, required: true },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);
