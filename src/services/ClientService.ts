import { connectDB } from "@/lib/mongodb";
import { clientRepository } from "@/repositories/ClientRepository";
import type { IClient } from "@/models/Client";

// Administrator/Operator are scoped to a single realtorId (their own); Root sees everyone's —
// see app/api/clients/route.ts for how the caller picks list() vs listForRealtor().
export class ClientService {
  static async list() {
    await connectDB();
    return clientRepository.findAll();
  }

  static async listForRealtor(realtorId: string) {
    await connectDB();
    return clientRepository.findByRealtorId(realtorId);
  }

  static async countForRealtor(realtorId: string) {
    await connectDB();
    return clientRepository.countByRealtorId(realtorId);
  }

  static async get(id: string) {
    await connectDB();
    return clientRepository.findById(id);
  }

  static async create(data: Partial<IClient>) {
    await connectDB();
    return clientRepository.create(data);
  }

  static async update(id: string, data: Partial<IClient>) {
    await connectDB();
    return clientRepository.update(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return clientRepository.delete(id);
  }
}
