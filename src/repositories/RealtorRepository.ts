import { Realtor, type IRealtor } from "@/models/Realtor";
import { BaseRepository } from "./BaseRepository";

class RealtorRepository extends BaseRepository<IRealtor> {
  constructor() {
    super(Realtor);
  }

  findByUserId(userId: string) {
    return this.model.findOne({ userId }).exec();
  }

  findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }

  findByGuid(guid: string) {
    return this.model.findOne({ guid }).exec();
  }
}

export const realtorRepository = new RealtorRepository();
