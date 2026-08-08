import { connectDB } from "@/lib/mongodb";
import { heatingMediumRepository } from "@/repositories/HeatingMediumRepository";
import type { IHeatingMedium } from "@/models/HeatingMedium";

export class HeatingMediumService {
  static async list() {
    await connectDB();
    return heatingMediumRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return heatingMediumRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return heatingMediumRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return heatingMediumRepository.findBySlug(slug);
  }

  static async create(data: Partial<IHeatingMedium>) {
    await connectDB();
    return heatingMediumRepository.create(data);
  }

  static async update(id: string, data: Partial<IHeatingMedium>) {
    await connectDB();
    return heatingMediumRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/HeatingMedium.ts.
  static async remove(id: string) {
    await connectDB();
    return heatingMediumRepository.softDelete(id);
  }
}
