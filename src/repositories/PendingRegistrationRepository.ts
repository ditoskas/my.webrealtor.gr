import { PendingRegistration, type IPendingRegistration } from "@/models/PendingRegistration";
import { BaseRepository } from "./BaseRepository";

class PendingRegistrationRepository extends BaseRepository<IPendingRegistration> {
  constructor() {
    super(PendingRegistration);
  }

  findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }

  findByToken(token: string) {
    return this.model.findOne({ token }).exec();
  }

  deleteByEmail(email: string) {
    return this.model.deleteOne({ email }).exec();
  }
}

export const pendingRegistrationRepository = new PendingRegistrationRepository();
