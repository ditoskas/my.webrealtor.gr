import { User, type IUser } from "@/models/User";
import { BaseRepository } from "./BaseRepository";

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  findByEmail(email: string) {
    return this.model.findOne({ email }).select("+password").exec();
  }

  findByRealtorId(realtorId: string) {
    return this.model.find({ realtorId }).sort({ createdAt: -1 }).exec();
  }

  findByIdWithPassword(id: string) {
    return this.model.findById(id).select("+password").exec();
  }

  /**
   * Creates a user whose `password` is already a bcrypt hash (computed at signup time — see
   * RegistrationService.completeRegistration) — sets $locals.skipPasswordHash so the
   * pre("save") hook doesn't hash it a second time, which would corrupt it.
   */
  async createWithHashedPassword(data: Partial<IUser> & { password: string }) {
    const user = new this.model(data);
    user.$locals.skipPasswordHash = true;
    await user.save();
    return user;
  }

  /**
   * Updates via `.save()` instead of the generic findByIdAndUpdate, so the password-hashing
   * pre("save") hook actually runs when `password` is part of the update. The base
   * BaseRepository.update() uses findByIdAndUpdate, which would silently persist a
   * plain-text password if used here.
   */
  async updateWithPassword(id: string, data: Partial<IUser>) {
    const user = await this.model.findById(id);
    if (!user) return null;
    Object.assign(user, data);
    await user.save();
    return user;
  }
}

export const userRepository = new UserRepository();
