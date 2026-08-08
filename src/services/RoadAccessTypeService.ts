import { connectDB } from "@/lib/mongodb";
import { roadAccessTypeRepository } from "@/repositories/RoadAccessTypeRepository";
import type { IRoadAccessType } from "@/models/RoadAccessType";

export class RoadAccessTypeService {
  static async list() {
    await connectDB();
    return roadAccessTypeRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return roadAccessTypeRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return roadAccessTypeRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return roadAccessTypeRepository.findBySlug(slug);
  }

  static async create(data: Partial<IRoadAccessType>) {
    await connectDB();
    return roadAccessTypeRepository.create(data);
  }

  static async update(id: string, data: Partial<IRoadAccessType>) {
    await connectDB();
    return roadAccessTypeRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/RoadAccessType.ts.
  static async remove(id: string) {
    await connectDB();
    return roadAccessTypeRepository.softDelete(id);
  }
}
