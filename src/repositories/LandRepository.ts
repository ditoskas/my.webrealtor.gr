import { Land, type ILand } from "@/models/Land";
import { BaseRepository } from "./BaseRepository";

class LandRepository extends BaseRepository<ILand> {
  constructor() {
    super(Land);
  }

  findByRealtorId(realtorId: string) {
    return this.model.find({ realtorId }).sort({ createdAt: -1 }).exec();
  }

  countByRealtorId(realtorId: string) {
    return this.model.countDocuments({ realtorId }).exec();
  }

  findByClientId(clientId: string) {
    return this.model.find({ clientId }).sort({ createdAt: -1 }).exec();
  }
}

export const landRepository = new LandRepository();
