import { GardenType, type IGardenType } from "@/models/GardenType";
import { BaseRepository } from "./BaseRepository";

class GardenTypeRepository extends BaseRepository<IGardenType> {
  constructor() {
    super(GardenType);
  }

  // Ascending createdAt (not BaseRepository.findAll's default newest-first) so the list keeps a
  // stable order matching insertion/seed order instead of most-recently-edited-first.
  findActive() {
    return this.model.find({ deletedAt: null }).sort({ createdAt: 1 }).exec();
  }

  findByName(name: string) {
    return this.model.findOne({ name, deletedAt: null }).exec();
  }

  // The uniqueness check the API routes actually rely on — slug, not name, is the identifier.
  findBySlug(slug: string) {
    return this.model.findOne({ slug, deletedAt: null }).exec();
  }

  softDelete(id: string) {
    return this.model.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).exec();
  }
}

export const gardenTypeRepository = new GardenTypeRepository();
