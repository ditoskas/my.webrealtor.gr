import { connectDB } from "@/lib/mongodb";
import { propertyCategoryRepository } from "@/repositories/PropertyCategoryRepository";
import type { IPropertyCategory } from "@/models/PropertyCategory";

export class PropertyCategoryService {
  static async list() {
    await connectDB();
    return propertyCategoryRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return propertyCategoryRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return propertyCategoryRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return propertyCategoryRepository.findBySlug(slug);
  }

  static async create(data: Partial<IPropertyCategory>) {
    await connectDB();
    return propertyCategoryRepository.create(data);
  }

  static async update(id: string, data: Partial<IPropertyCategory>) {
    await connectDB();
    return propertyCategoryRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/PropertyCategory.ts.
  static async remove(id: string) {
    await connectDB();
    return propertyCategoryRepository.softDelete(id);
  }
}
