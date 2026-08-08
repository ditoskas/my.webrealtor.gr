import { Note, type INote } from "@/models/Note";
import type { NoteEntityType } from "@/lib/types";
import { BaseRepository } from "./BaseRepository";

class NoteRepository extends BaseRepository<INote> {
  constructor() {
    super(Note);
  }

  findByEntity(entityType: NoteEntityType, entityId: string) {
    return this.model.find({ entityType, entityId }).sort({ createdAt: -1 }).exec();
  }
}

export const noteRepository = new NoteRepository();
