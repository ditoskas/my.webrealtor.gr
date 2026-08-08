import { connectDB } from "@/lib/mongodb";
import { floorLevelRepository } from "@/repositories/FloorLevelRepository";
import type { IFloorLevel } from "@/models/FloorLevel";

export class FloorLevelService {
  static async list() {
    await connectDB();
    return floorLevelRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return floorLevelRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return floorLevelRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return floorLevelRepository.findBySlug(slug);
  }

  static async create(data: Partial<IFloorLevel>) {
    await connectDB();
    return floorLevelRepository.create(data);
  }

  static async update(id: string, data: Partial<IFloorLevel>) {
    await connectDB();
    return floorLevelRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/FloorLevel.ts.
  static async remove(id: string) {
    await connectDB();
    return floorLevelRepository.softDelete(id);
  }
}
