import { connectDB } from "@/lib/mongodb";
import { transactionRepository } from "@/repositories/TransactionRepository";
import type { ITransaction } from "@/models/Transaction";

// Root sees every realtor's transactions via list(); Administrator/Operator are scoped to their
// own via listForRealtor() — same split as ClientService/PropertyService/LandService.
export class TransactionService {
  static async list() {
    await connectDB();
    return transactionRepository.findAll();
  }

  static async listForRealtor(realtorId: string) {
    await connectDB();
    return transactionRepository.findByRealtorId(realtorId);
  }

  static async get(id: string) {
    await connectDB();
    return transactionRepository.findById(id);
  }

  static async create(data: Partial<ITransaction>) {
    await connectDB();
    return transactionRepository.create(data);
  }

  static async update(id: string, data: Partial<ITransaction>) {
    await connectDB();
    return transactionRepository.update(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return transactionRepository.delete(id);
  }
}
