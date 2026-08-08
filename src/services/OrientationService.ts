import { connectDB } from "@/lib/mongodb";
import { orientationRepository } from "@/repositories/OrientationRepository";
import type { IOrientation } from "@/models/Orientation";

export class OrientationService {
  static async list() {
    await connectDB();
    return orientationRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return orientationRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return orientationRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return orientationRepository.findBySlug(slug);
  }

  static async create(data: Partial<IOrientation>) {
    await connectDB();
    return orientationRepository.create(data);
  }

  static async update(id: string, data: Partial<IOrientation>) {
    await connectDB();
    return orientationRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/Orientation.ts.
  static async remove(id: string) {
    await connectDB();
    return orientationRepository.softDelete(id);
  }
}
