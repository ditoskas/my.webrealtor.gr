import type { SchemaOptions } from "mongoose";

/**
 * Shared schema options for every model: guarantees createdAt/updatedAt (see CLAUDE.md —
 * "every model has createdAt and updatedAt" is a hard rule) and makes serialized JSON expose
 * `id` (string) instead of `_id`/`__v`, so API responses match the `id`-based frontend types
 * in lib/types.ts without each model hand-rolling a DTO mapper.
 */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      delete (ret as { _id?: unknown })._id;
    },
  },
};
