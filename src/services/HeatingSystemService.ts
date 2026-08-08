import { connectDB } from "@/lib/mongodb";
import { heatingSystemRepository } from "@/repositories/HeatingSystemRepository";
import type { IHeatingSystem } from "@/models/HeatingSystem";

export class HeatingSystemService {
  static async list() {
    await connectDB();
    return heatingSystemRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return heatingSystemRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return heatingSystemRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return heatingSystemRepository.findBySlug(slug);
  }

  static async create(data: Partial<IHeatingSystem>) {
    await connectDB();
    return heatingSystemRepository.create(data);
  }

  static async update(id: string, data: Partial<IHeatingSystem>) {
    await connectDB();
    return heatingSystemRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/HeatingSystem.ts.
  static async remove(id: string) {
    await connectDB();
    return heatingSystemRepository.softDelete(id);
  }
}
