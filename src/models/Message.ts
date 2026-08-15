import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

// One row per submission received via POST /api/public/message — see CLAUDE.md → "Messages" /
// PUBLIC_API.md. slug/subject/recipient are copied from the MessageForm *at receipt time* (not
// populated live) so a later edit to the form config never rewrites already-received history;
// messageFormId is kept only for traceability back to the config that produced it.
export interface IMessage extends Document {
  realtorId: mongoose.Types.ObjectId;
  messageFormId: mongoose.Types.ObjectId;
  slug: string;
  subject: string;
  recipient: string;
  body: Record<string, unknown>;
  emailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type IMessageModel = Model<IMessage>;

const messageSchema = new Schema<IMessage, IMessageModel>(
  {
    realtorId: { type: Schema.Types.ObjectId, ref: "Realtor", required: true },
    messageFormId: { type: Schema.Types.ObjectId, ref: "MessageForm", required: true },
    slug: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    recipient: { type: String, required: true, trim: true },
    body: { type: Schema.Types.Mixed, required: true },
    emailSent: { type: Boolean, required: true, default: false },
  },
  baseSchemaOptions
);

messageSchema.index({ realtorId: 1, createdAt: -1 });

export const Message =
  (mongoose.models.Message as IMessageModel) ||
  mongoose.model<IMessage, IMessageModel>("Message", messageSchema);
