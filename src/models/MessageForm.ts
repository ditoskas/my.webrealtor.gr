import mongoose, { Schema, Document, Model } from "mongoose";
import { randomUUID } from "crypto";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

// One config per embeddable public form (e.g. a realtor's website contact form) — see
// CLAUDE.md → "Messages" / PUBLIC_API.md. `guid` is the secret-ish lookup key an external site
// posts to POST /api/public/message, always server-generated (never accepted from a client
// request body — see MessageFormService.create).
export interface IMessageForm extends Document {
  realtorId: mongoose.Types.ObjectId;
  guid: string;
  slug: string;
  subject: string;
  recipient: string;
  createdAt: Date;
  updatedAt: Date;
}

type IMessageFormModel = Model<IMessageForm>;

const messageFormSchema = new Schema<IMessageForm, IMessageFormModel>(
  {
    realtorId: { type: Schema.Types.ObjectId, ref: "Realtor", required: true },
    guid: { type: String, required: true, unique: true, default: () => randomUUID() },
    slug: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    recipient: { type: String, required: true, trim: true, lowercase: true },
  },
  baseSchemaOptions
);

messageFormSchema.index({ realtorId: 1 });

export const MessageForm =
  (mongoose.models.MessageForm as IMessageFormModel) ||
  mongoose.model<IMessageForm, IMessageFormModel>("MessageForm", messageFormSchema);
