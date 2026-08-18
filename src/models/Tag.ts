import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

// A realtor's own free-form labels, self-managed from Profile (see CLAUDE.md → "Tags") and
// assignable to that realtor's own Assets. Deliberately per-realtor, not a global Settings pool
// entity like PropertyCategory/LandCategory — every realtor keeps its own independent tag set,
// no admin-curated shared list. No slug (nothing looks these up by a URL-safe identifier) and no
// soft-delete (`deletedAt`) like the pool entities — a removed tag is genuinely gone, see
// TagService.remove()'s cascade cleanup of any Asset still referencing it.
export interface ITag extends Document {
  realtorId: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

type ITagModel = Model<ITag>;

const tagSchema = new Schema<ITag, ITagModel>(
  {
    realtorId: { type: Schema.Types.ObjectId, ref: "Realtor", required: true },
    name: { type: String, required: true, trim: true },
  },
  baseSchemaOptions
);

// A realtor can't have two tags with the same name — enforced here (not just app-level) since
// this is the actual uniqueness boundary; the app-level check in TagService.create()/update() is
// just there to return a clean 409 instead of a raw duplicate-key error.
tagSchema.index({ realtorId: 1, name: 1 }, { unique: true });

export const Tag =
  (mongoose.models.Tag as ITagModel) || mongoose.model<ITag, ITagModel>("Tag", tagSchema);
