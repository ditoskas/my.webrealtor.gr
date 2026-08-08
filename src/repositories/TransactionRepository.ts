import { Transaction, type ITransaction } from "@/models/Transaction";
import { BaseRepository } from "./BaseRepository";

class TransactionRepository extends BaseRepository<ITransaction> {
  constructor() {
    super(Transaction);
  }

  findByRealtorId(realtorId: string) {
    return this.model.find({ realtorId }).sort({ date: -1, createdAt: -1 }).exec();
  }

  countByRealtorId(realtorId: string) {
    return this.model.countDocuments({ realtorId }).exec();
  }
}

export const transactionRepository = new TransactionRepository();
