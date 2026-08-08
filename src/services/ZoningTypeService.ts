import { connectDB } from "@/lib/mongodb";
import { zoningTypeRepository } from "@/repositories/ZoningTypeRepository";
import type { IZoningType } from "@/models/ZoningType";

export class ZoningTypeService {
  static async list() {
    await connectDB();
    return zoningTypeRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return zoningTypeRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return zoningTypeRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return zoningTypeRepository.findBySlug(slug);
  }

  static async create(data: Partial<IZoningType>) {
    await connectDB();
    return zoningTypeRepository.create(data);
  }

  static async update(id: string, data: Partial<IZoningType>) {
    await connectDB();
    return zoningTypeRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/ZoningType.ts.
  static async remove(id: string) {
    await connectDB();
    return zoningTypeRepository.softDelete(id);
  }
}
