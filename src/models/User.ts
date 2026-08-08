import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { USER_ROLES, type UserRole } from "@/lib/types";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  realtorId?: mongoose.Types.ObjectId | null;
  // Self-service editable on the Profile page, same as `language` — an optional friendly name
  // shown instead of the email in the Topbar and the post-login welcome message whenever it's
  // set (see CLAUDE.md → Profile). Empty string means "not set", not a real blank name.
  displayName: string;
  language: Locale;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type IUserModel = Model<IUser>;

const userSchema = new Schema<IUser, IUserModel>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: { type: String, enum: USER_ROLES, default: "Operator", required: true },
    realtorId: { type: Schema.Types.ObjectId, ref: "Realtor", default: null },
    displayName: { type: String, default: "", trim: true },
    // Self-service editable on the Profile page — see CLAUDE.md → Profile.
    language: { type: String, enum: LOCALES, default: DEFAULT_LOCALE, required: true },
    tokenVersion: { type: Number, default: 0, required: true },
  },
  baseSchemaOptions
);

// A Root user is platform-wide and never belongs to a realtor; Administrator/Operator
// always belong to exactly one. Enforced here, not just in the route handler, so it can
// never be violated regardless of caller.
userSchema.pre("validate", function enforceRealtorAssignment() {
  if (this.role === "Root") {
    this.realtorId = null;
  } else if (!this.realtorId) {
    this.invalidate("realtorId", "realtorId is required for Administrator and Operator roles");
  }
});

userSchema.pre("save", async function hashPassword() {
  // $locals.skipPasswordHash lets a caller pass an already-hashed password through unchanged
  // (see UserRepository.createWithHashedPassword) — used only by registration completion,
  // where the password was hashed at signup time, before the User document could even exist.
  if (!this.isModified("password") || this.$locals.skipPasswordHash) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User =
  (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>("User", userSchema);
