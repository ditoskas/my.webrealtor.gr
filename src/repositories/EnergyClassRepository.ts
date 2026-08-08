import { EnergyClass, type IEnergyClass } from "@/models/EnergyClass";
import { BaseRepository } from "./BaseRepository";

class EnergyClassRepository extends BaseRepository<IEnergyClass> {
  constructor() {
    super(EnergyClass);
  }

  // Ascending createdAt (not BaseRepository.findAll's default newest-first) so seeded/created
  // ratings keep a stable, meaningful order (best → worst) instead of most-recent-first.
  findActive() {
    return this.model.find({ deletedAt: null }).sort({ createdAt: 1 }).exec();
  }

  findByName(name: string) {
    return this.model.findOne({ name, deletedAt: null }).exec();
  }

  softDelete(id: string) {
    return this.model.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).exec();
  }
}

export const energyClassRepository = new EnergyClassRepository();
