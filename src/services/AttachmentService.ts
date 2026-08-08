import mongoose from "mongoose";
import { unlink } from "fs/promises";
import { connectDB } from "@/lib/mongodb";
import { attachmentRepository } from "@/repositories/AttachmentRepository";
import { UPLOADS_PUBLIC_URL, resolveUploadPath } from "@/lib/uploads";
import type { AttachableEntityType } from "@/lib/types";

interface CreateAttachmentParams {
  entityType: AttachableEntityType;
  entityId: string;
  title: string;
  description: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  userId: string | null;
}

interface UpdateAttachmentParams {
  title: string;
  description: string;
}

export class AttachmentService {
  static async listForEntity(entityType: AttachableEntityType, entityId: string) {
    await connectDB();
    return attachmentRepository.findByEntity(entityType, entityId);
  }

  static async get(id: string) {
    await connectDB();
    return attachmentRepository.findById(id);
  }

  static async create(data: CreateAttachmentParams) {
    await connectDB();
    return attachmentRepository.create({
      entityType: data.entityType,
      entityId: new mongoose.Types.ObjectId(data.entityId),
      title: data.title,
      description: data.description,
      fileName: data.fileName,
      url: data.url,
      mimeType: data.mimeType,
      size: data.size,
      userId: data.userId ? new mongoose.Types.ObjectId(data.userId) : null,
    });
  }

  static async update(id: string, data: UpdateAttachmentParams) {
    await connectDB();
    return attachmentRepository.update(id, data);
  }

  // Deletes the DB record, then best-effort unlinks the underlying file — a missing/already-gone
  // file on disk must never block the DB delete from succeeding, same discipline as
  // PriceHistoryService/LogEntryService's best-effort writes elsewhere in this repo.
  static async remove(id: string) {
    await connectDB();
    const existing = await attachmentRepository.findById(id);
    if (!existing) return null;

    const deleted = await attachmentRepository.delete(id);

    if (existing.url.startsWith(UPLOADS_PUBLIC_URL)) {
      const relative = existing.url.slice(UPLOADS_PUBLIC_URL.length);
      const filePath = resolveUploadPath(relative.split("/").filter(Boolean));
      if (filePath) {
        try {
          await unlink(filePath);
        } catch (error) {
          console.error("Failed to remove attachment file from disk", error);
        }
      }
    }

    return deleted;
  }
}
