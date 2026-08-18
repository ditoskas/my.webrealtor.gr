import { Tag, type ITag } from "@/models/Tag";
import { BaseRepository } from "./BaseRepository";

class TagRepository extends BaseRepository<ITag> {
  constructor() {
    super(Tag);
  }

  findByRealtorId(realtorId: string) {
    return this.model.find({ realtorId }).sort({ name: 1 }).exec();
  }

  // Case-insensitive so "Recent" and "recent" are still treated as the same tag — used both by
  // TagService's own duplicate-name check and by the default-tag seeder (RealtorService.create /
  // RegistrationService.completeRegistration / the backfill script) to stay idempotent.
  findByRealtorIdAndName(realtorId: string, name: string) {
    return this.model
      .findOne({ realtorId, name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } })
      .exec();
  }
}

export const tagRepository = new TagRepository();
