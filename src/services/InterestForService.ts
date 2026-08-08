import { connectDB } from "@/lib/mongodb";
import { interestForRepository } from "@/repositories/InterestForRepository";
import type { IInterestFor } from "@/models/InterestFor";

export class InterestForService {
  static async listForClient(clientId: string) {
    await connectDB();
    return interestForRepository.findByClientId(clientId);
  }

  static async get(id: string) {
    await connectDB();
    return interestForRepository.findById(id);
  }

  static async create(data: Partial<IInterestFor>) {
    await connectDB();
    return interestForRepository.create(data);
  }

  static async update(id: string, data: Partial<IInterestFor>) {
    await connectDB();
    return interestForRepository.update(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return interestForRepository.delete(id);
  }
}
