import { connectDB } from "@/lib/mongodb";
import { energyClassRepository } from "@/repositories/EnergyClassRepository";
import type { IEnergyClass } from "@/models/EnergyClass";

export class EnergyClassService {
  static async list() {
    await connectDB();
    return energyClassRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return energyClassRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return energyClassRepository.findByName(name);
  }

  static async create(data: Partial<IEnergyClass>) {
    await connectDB();
    return energyClassRepository.create(data);
  }

  static async update(id: string, data: Partial<IEnergyClass>) {
    await connectDB();
    return energyClassRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/EnergyClass.ts.
  static async remove(id: string) {
    await connectDB();
    return energyClassRepository.softDelete(id);
  }
}
