import { connectDB } from "@/lib/mongodb";
import { slopeRepository } from "@/repositories/SlopeRepository";
import type { ISlope } from "@/models/Slope";

export class SlopeService {
  static async list() {
    await connectDB();
    return slopeRepository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return slopeRepository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return slopeRepository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return slopeRepository.findBySlug(slug);
  }

  static async create(data: Partial<ISlope>) {
    await connectDB();
    return slopeRepository.create(data);
  }

  static async update(id: string, data: Partial<ISlope>) {
    await connectDB();
    return slopeRepository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/Slope.ts.
  static async remove(id: string) {
    await connectDB();
    return slopeRepository.softDelete(id);
  }
}
