import { connectDB } from "@/lib/mongodb";
import { userRepository } from "@/repositories/UserRepository";
import type { IUser } from "@/models/User";

// Root manages every user; Administrator/Operator management (if ever exposed to non-Root
// callers) must be scoped to the caller's own realtorId by the route handler.
export class UserService {
  static async list() {
    await connectDB();
    return userRepository.findAll();
  }

  static async get(id: string) {
    await connectDB();
    return userRepository.findById(id);
  }

  static async findByEmail(email: string) {
    await connectDB();
    return userRepository.findByEmail(email);
  }

  static async create(data: Partial<IUser>) {
    await connectDB();
    return userRepository.create(data);
  }

  static async update(id: string, data: Partial<IUser>) {
    await connectDB();
    return userRepository.updateWithPassword(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return userRepository.delete(id);
  }
}
