import { connectDB } from "@/lib/mongodb";
import { viewingRepository } from "@/repositories/ViewingRepository";
import type { IViewing } from "@/models/Viewing";

export class ViewingService {
  static async listForClient(clientId: string) {
    await connectDB();
    return viewingRepository.findByClientId(clientId);
  }

  static async get(id: string) {
    await connectDB();
    return viewingRepository.findById(id);
  }

  static async create(data: Partial<IViewing>) {
    await connectDB();
    return viewingRepository.create(data);
  }

  static async update(id: string, data: Partial<IViewing>) {
    await connectDB();
    return viewingRepository.update(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return viewingRepository.delete(id);
  }
}
