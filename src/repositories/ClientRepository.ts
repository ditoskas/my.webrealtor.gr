import { Client, type IClient } from "@/models/Client";
import { BaseRepository } from "./BaseRepository";

class ClientRepository extends BaseRepository<IClient> {
  constructor() {
    super(Client);
  }

  findByRealtorId(realtorId: string) {
    return this.model.find({ realtorId }).sort({ createdAt: -1 }).exec();
  }

  countByRealtorId(realtorId: string) {
    return this.model.countDocuments({ realtorId }).exec();
  }
}

export const clientRepository = new ClientRepository();
