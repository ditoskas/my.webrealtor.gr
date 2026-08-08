import { connectDB } from "@/lib/mongodb";
import { joineryTypeRepository } from "@/repositories/JoineryTypeRepository";
import type { IJoineryType } from "@/models/JoineryType";

export class JoineryTypeService {
  static async list() {
    await connectDB();
    return joineryTypeRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return joineryTypeRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return joineryTypeRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return joineryTypeRepository.findBySlug(slug);
  }

  static async create(data: Partial<IJoineryType>) {
    await connectDB();
    return joineryTypeRepository.create(data);
  }

  static async update(id: string, data: Partial<IJoineryType>) {
    await connectDB();
    return joineryTypeRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/JoineryType.ts.
  static async remove(id: string) {
    await connectDB();
    return joineryTypeRepository.softDelete(id);
  }
}
