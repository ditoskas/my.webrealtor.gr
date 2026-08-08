import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { noteRepository } from "@/repositories/NoteRepository";
import type { NoteEntityType, NoteImportance } from "@/lib/types";

interface CreateNoteParams {
  entityType: NoteEntityType;
  entityId: string;
  title: string;
  text: string;
  importance: NoteImportance;
  userId: string | null;
}

interface UpdateNoteParams {
  title: string;
  text: string;
  importance: NoteImportance;
}

export class NoteService {
  static async listForEntity(entityType: NoteEntityType, entityId: string) {
    await connectDB();
    return noteRepository.findByEntity(entityType, entityId);
  }

  static async get(id: string) {
    await connectDB();
    return noteRepository.findById(id);
  }

  static async create(data: CreateNoteParams) {
    await connectDB();
    return noteRepository.create({
      entityType: data.entityType,
      entityId: new mongoose.Types.ObjectId(data.entityId),
      title: data.title,
      text: data.text,
      importance: data.importance,
      userId: data.userId ? new mongoose.Types.ObjectId(data.userId) : null,
    });
  }

  static async update(id: string, data: UpdateNoteParams) {
    await connectDB();
    return noteRepository.update(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return noteRepository.delete(id);
  }
}
