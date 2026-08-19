import path from "path";
import type { AttachableEntityType, TransactionFileKind } from "./types";

// Server-only — deliberately not NEXT_PUBLIC_ (see .env.example), since only API route handlers
// (POST /api/uploads, GET /uploads/[...path]) ever need these. Falls back to a local ./uploads
// folder (gitignored) so a bare `npm run dev` outside Docker still works without extra setup.
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
export const UPLOADS_PUBLIC_URL = process.env.UPLOADS_PUBLIC_URL || "/uploads";

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per file

// Whitelist, not a trust-the-client-extension approach — the saved filename's extension is derived
// from this map (keyed by the browser-reported MIME type), never from the client-supplied filename.
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Files (Attachments) — a deliberately broader whitelist than ALLOWED_IMAGE_TYPES (everyday
// document/spreadsheet/presentation/archive/image types), but still a whitelist, not a denylist of
// "dangerous" extensions. This is the actual security boundary for "no .exe/.bat/.sh/.ps1/etc." —
// anything not in this map (executables, scripts, and anything else unanticipated) is rejected by
// construction, the same reasoning ALLOWED_IMAGE_TYPES above already established.
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/rtf": "rtf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Shared by the GET /uploads/[...path] serving route, which doesn't know (or care) whether a given
// file came from the Property/Land media flow or the Files/Attachments flow — both write under the
// same UPLOADS_DIR root, so both whitelists apply when deciding what's servable.
const EXTENSION_TO_MIME: Record<string, string> = Object.fromEntries(
  [...Object.entries(ALLOWED_IMAGE_TYPES), ...Object.entries(ALLOWED_ATTACHMENT_TYPES)].map(([mime, ext]) => [ext, mime])
);

export function mimeForExtension(ext: string): string | null {
  return EXTENSION_TO_MIME[ext.toLowerCase()] ?? null;
}

// realtorId/listingId are Mongo ObjectId strings, but they arrive as plain form-data fields — this
// is the boundary check before either is used as a path segment, not just a Mongoose cast.
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export function isValidObjectIdSegment(value: unknown): value is string {
  return typeof value === "string" && OBJECT_ID_PATTERN.test(value);
}

/**
 * `<UPLOADS_DIR>/realtors/<realtorId>/assets/<listingId>/` — every Asset (property or land, see
 * CLAUDE.md → "Asset management") upload lands in a per-realtor, per-listing folder nested under
 * its own `assets` segment (see POST /api/uploads), so it can never collide with that same
 * realtor's `profile` folder below, and stays organized for anyone browsing UPLOADS_DIR directly
 * on disk. Renamed from the flat `realtors/<realtorId>/<listingId>/` layout as part of the
 * Property+Land merge — see `scripts/migrate-asset-images-to-nested-folder.ts` for the one-off
 * move of already-uploaded files/URLs into this shape.
 */
export function listingUploadDir(realtorId: string, listingId: string): string {
  return path.join(UPLOADS_DIR, "realtors", realtorId, "assets", listingId);
}

export function listingUploadUrlPrefix(realtorId: string, listingId: string): string {
  return `${UPLOADS_PUBLIC_URL}/realtors/${realtorId}/assets/${listingId}`;
}

/**
 * `<UPLOADS_DIR>/realtors/<realtorId>/profile/` — a Realtor's single profile photo (see
 * models/Realtor.ts's `imageUrl`, POST/DELETE /api/realtors/[id]/image). Deliberately its own
 * `profile` subfolder, not dropped directly under `realtors/<realtorId>/`, so it never mixes with
 * that same realtor's Attachments (attachmentUploadDir below writes straight into that folder).
 */
export function realtorImageUploadDir(realtorId: string): string {
  return path.join(UPLOADS_DIR, "realtors", realtorId, "profile");
}

export function realtorImageUploadUrlPrefix(realtorId: string): string {
  return `${UPLOADS_PUBLIC_URL}/realtors/${realtorId}/profile`;
}

/**
 * `<UPLOADS_DIR>/transactions/<transactionId>/<receipt|contract>/` — a Transaction's two file
 * slots (see models/Transaction.ts, POST/DELETE /api/transactions/[id]/files/[kind]). Split by
 * kind so replacing one never touches the other.
 */
export function transactionFileUploadDir(transactionId: string, kind: TransactionFileKind): string {
  return path.join(UPLOADS_DIR, "transactions", transactionId, kind);
}

export function transactionFileUploadUrlPrefix(transactionId: string, kind: TransactionFileKind): string {
  return `${UPLOADS_PUBLIC_URL}/transactions/${transactionId}/${kind}`;
}

// Files (Attachments) storage layout — deliberately separate from listingUploadDir above: this one
// covers all four attachable entities directly (including Realtor/Client, which have no "listing"
// concept), not just Property/Land media, so it's organized by entity type first rather than
// nested under realtors/.
const ATTACHMENT_ENTITY_FOLDER: Record<AttachableEntityType, string> = {
  Realtor: "realtors",
  Client: "clients",
  Property: "properties",
  Land: "lands",
};

/**
 * `<UPLOADS_DIR>/<realtors|clients|properties|lands>/<entityId>/` — every attachment for a given
 * Realtor/Client/Property/Land lands in its own folder, one level down from an entity-type folder.
 */
export function attachmentUploadDir(entityType: AttachableEntityType, entityId: string): string {
  return path.join(UPLOADS_DIR, ATTACHMENT_ENTITY_FOLDER[entityType], entityId);
}

export function attachmentUploadUrlPrefix(entityType: AttachableEntityType, entityId: string): string {
  return `${UPLOADS_PUBLIC_URL}/${ATTACHMENT_ENTITY_FOLDER[entityType]}/${entityId}`;
}

/**
 * Resolves a requested `/uploads/<...segments>` path to an absolute file path, rejecting anything
 * that would escape UPLOADS_DIR (path traversal via "..", absolute segments, etc.). Returns null
 * if the resolved path isn't inside UPLOADS_DIR.
 */
export function resolveUploadPath(segments: string[]): string | null {
  const resolvedDir = path.resolve(UPLOADS_DIR);
  const resolvedPath = path.resolve(resolvedDir, ...segments);
  if (resolvedPath !== resolvedDir && !resolvedPath.startsWith(resolvedDir + path.sep)) {
    return null;
  }
  return resolvedPath;
}
