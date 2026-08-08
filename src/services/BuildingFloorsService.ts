import { connectDB } from "@/lib/mongodb";
import { buildingFloorsRepository } from "@/repositories/BuildingFloorsRepository";
import type { IBuildingFloors } from "@/models/BuildingFloors";

export class BuildingFloorsService {
  static async list() {
    await connectDB();
    return buildingFloorsRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return buildingFloorsRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return buildingFloorsRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return buildingFloorsRepository.findBySlug(slug);
  }

  static async create(data: Partial<IBuildingFloors>) {
    await connectDB();
    return buildingFloorsRepository.create(data);
  }

  static async update(id: string, data: Partial<IBuildingFloors>) {
    await connectDB();
    return buildingFloorsRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/BuildingFloors.ts.
  static async remove(id: string) {
    await connectDB();
    return buildingFloorsRepository.softDelete(id);
  }
}
