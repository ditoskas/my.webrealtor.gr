import { Attachment, type IAttachment } from "@/models/Attachment";
import type { AttachableEntityType } from "@/lib/types";
import { BaseRepository } from "./BaseRepository";

class AttachmentRepository extends BaseRepository<IAttachment> {
  constructor() {
    super(Attachment);
  }

  findByEntity(entityType: AttachableEntityType, entityId: string) {
    return this.model.find({ entityType, entityId }).sort({ createdAt: -1 }).exec();
  }
}

export const attachmentRepository = new AttachmentRepository();
