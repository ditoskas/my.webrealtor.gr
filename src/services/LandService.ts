import { connectDB } from "@/lib/mongodb";
import { landRepository } from "@/repositories/LandRepository";
import type { ILand } from "@/models/Land";

// Root sees every realtor's listings via list(); Administrator/Operator are scoped to their own via
// listForRealtor() — same split as PropertyService, decided by the route handler based on the caller.
export class LandService {
  static async list() {
    await connectDB();
    return landRepository.findAll();
  }

  static async listForRealtor(realtorId: string) {
    await connectDB();
    return landRepository.findByRealtorId(realtorId);
  }

  static async countForRealtor(realtorId: string) {
    await connectDB();
    return landRepository.countByRealtorId(realtorId);
  }

  // Used by the Client View Page's "Owns" tab — see CLAUDE.md → "Owns (Client)".
  static async listForClient(clientId: string) {
    await connectDB();
    return landRepository.findByClientId(clientId);
  }

  static async get(id: string) {
    await connectDB();
    return landRepository.findById(id);
  }

  static async create(data: Partial<ILand>) {
    await connectDB();
    return landRepository.create(data);
  }

  static async update(id: string, data: Partial<ILand>) {
    await connectDB();
    return landRepository.update(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return landRepository.delete(id);
  }
}
