import { Property, type IProperty } from "@/models/Property";
import { BaseRepository } from "./BaseRepository";

class PropertyRepository extends BaseRepository<IProperty> {
  constructor() {
    super(Property);
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

export const propertyRepository = new PropertyRepository();
