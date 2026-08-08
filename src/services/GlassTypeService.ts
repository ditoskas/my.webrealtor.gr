import { connectDB } from "@/lib/mongodb";
import { glassTypeRepository } from "@/repositories/GlassTypeRepository";
import type { IGlassType } from "@/models/GlassType";

export class GlassTypeService {
  static async list() {
    await connectDB();
    return glassTypeRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return glassTypeRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return glassTypeRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return glassTypeRepository.findBySlug(slug);
  }

  static async create(data: Partial<IGlassType>) {
    await connectDB();
    return glassTypeRepository.create(data);
  }

  static async update(id: string, data: Partial<IGlassType>) {
    await connectDB();
    return glassTypeRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/GlassType.ts.
  static async remove(id: string) {
    await connectDB();
    return glassTypeRepository.softDelete(id);
  }
}
