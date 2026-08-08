import { Viewing, type IViewing } from "@/models/Viewing";
import { BaseRepository } from "./BaseRepository";

class ViewingRepository extends BaseRepository<IViewing> {
  constructor() {
    super(Viewing);
  }

  findByClientId(clientId: string) {
    return this.model.find({ clientId }).sort({ date: -1, createdAt: -1 }).exec();
  }
}

export const viewingRepository = new ViewingRepository();
