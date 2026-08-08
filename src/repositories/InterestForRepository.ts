import { InterestFor, type IInterestFor } from "@/models/InterestFor";
import { BaseRepository } from "./BaseRepository";

class InterestForRepository extends BaseRepository<IInterestFor> {
  constructor() {
    super(InterestFor);
  }

  findByClientId(clientId: string) {
    return this.model.find({ clientId }).sort({ date: -1, createdAt: -1 }).exec();
  }
}

export const interestForRepository = new InterestForRepository();
