import { connectDB } from "@/lib/mongodb";
import { gardenTypeRepository } from "@/repositories/GardenTypeRepository";
import type { IGardenType } from "@/models/GardenType";

export class GardenTypeService {
  static async list() {
    await connectDB();
    return gardenTypeRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return gardenTypeRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return gardenTypeRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return gardenTypeRepository.findBySlug(slug);
  }

  static async create(data: Partial<IGardenType>) {
    await connectDB();
    return gardenTypeRepository.create(data);
  }

  static async update(id: string, data: Partial<IGardenType>) {
    await connectDB();
    return gardenTypeRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/GardenType.ts.
  static async remove(id: string) {
    await connectDB();
    return gardenTypeRepository.softDelete(id);
  }
}
