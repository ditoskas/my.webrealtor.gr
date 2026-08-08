import { connectDB } from "@/lib/mongodb";
import { floorTypeRepository } from "@/repositories/FloorTypeRepository";
import type { IFloorType } from "@/models/FloorType";

export class FloorTypeService {
  static async list() {
    await connectDB();
    return floorTypeRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return floorTypeRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return floorTypeRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return floorTypeRepository.findBySlug(slug);
  }

  static async create(data: Partial<IFloorType>) {
    await connectDB();
    return floorTypeRepository.create(data);
  }

  static async update(id: string, data: Partial<IFloorType>) {
    await connectDB();
    return floorTypeRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/FloorType.ts.
  static async remove(id: string) {
    await connectDB();
    return floorTypeRepository.softDelete(id);
  }
}
