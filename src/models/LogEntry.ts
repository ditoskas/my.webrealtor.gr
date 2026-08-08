import mongoose, { Schema, Document, Model } from "mongoose";
import { LOG_TYPES, type LogType } from "@/lib/types";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface ILogEntry extends Document {
  category: string;
  logType: LogType;
  userId?: mongoose.Types.ObjectId | null;
  realtorId?: mongoose.Types.ObjectId | null;
  message: string;
  dataFrom?: Record<string, unknown> | null;
  dataTo?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

type ILogEntryModel = Model<ILogEntry>;

const logEntrySchema = new Schema<ILogEntry, ILogEntryModel>(
  {
    // Free-form section name, e.g. "Realtors", "Users", "Security" (login/logout) — not a
    // closed enum, new categories can be introduced as new features start logging.
    category: { type: String, required: true, trim: true },
    logType: { type: String, enum: LOG_TYPES, required: true, default: "Information" },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    realtorId: { type: Schema.Types.ObjectId, ref: "Realtor", default: null },
    message: { type: String, required: true },
    dataFrom: { type: Schema.Types.Mixed, default: null },
    dataTo: { type: Schema.Types.Mixed, default: null },
  },
  baseSchemaOptions
);

export const LogEntry =
  (mongoose.models.LogEntry as ILogEntryModel) ||
  mongoose.model<ILogEntry, ILogEntryModel>("LogEntry", logEntrySchema);
