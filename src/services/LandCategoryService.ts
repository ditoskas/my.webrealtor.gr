import { connectDB } from "@/lib/mongodb";
import { landCategoryRepository } from "@/repositories/LandCategoryRepository";
import type { ILandCategory } from "@/models/LandCategory";

export class LandCategoryService {
  static async list() {
    await connectDB();
    return landCategoryRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return landCategoryRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return landCategoryRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return landCategoryRepository.findBySlug(slug);
  }

  static async create(data: Partial<ILandCategory>) {
    await connectDB();
    return landCategoryRepository.create(data);
  }

  static async update(id: string, data: Partial<ILandCategory>) {
    await connectDB();
    return landCategoryRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/LandCategory.ts.
  static async remove(id: string) {
    await connectDB();
    return landCategoryRepository.softDelete(id);
  }
}
