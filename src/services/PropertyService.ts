import { connectDB } from "@/lib/mongodb";
import { propertyRepository, type PublicPropertyFilters } from "@/repositories/PropertyRepository";
import type { IProperty } from "@/models/Property";

// Root sees every realtor's listings via list(); Administrator/Operator are scoped to their own via
// listForRealtor() — same split as ClientService, decided by the route handler based on the caller.
export class PropertyService {
  static async list() {
    await connectDB();
    return propertyRepository.findAll();
  }

  static async listForRealtor(realtorId: string) {
    await connectDB();
    return propertyRepository.findByRealtorId(realtorId);
  }

  static async countForRealtor(realtorId: string) {
    await connectDB();
    return propertyRepository.countByRealtorId(realtorId);
  }

  // Used by the Client View Page's "Owns" tab — see CLAUDE.md → "Owns (Client)".
  static async listForClient(clientId: string) {
    await connectDB();
    return propertyRepository.findByClientId(clientId);
  }

  // Backs GET /api/public/properties — see PUBLIC_API.md.
  static async listPublicForRealtor(realtorId: string, filters: PublicPropertyFilters) {
    await connectDB();
    return propertyRepository.findPublicByRealtorId(realtorId, filters);
  }

  static async get(id: string) {
    await connectDB();
    return propertyRepository.findById(id);
  }

  static async create(data: Partial<IProperty>) {
    await connectDB();
    return propertyRepository.create(data);
  }

  static async update(id: string, data: Partial<IProperty>) {
    await connectDB();
    return propertyRepository.update(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return propertyRepository.delete(id);
  }
}
