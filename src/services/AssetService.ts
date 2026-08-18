import { connectDB } from "@/lib/mongodb";
import { assetRepository, type PublicAssetFilters } from "@/repositories/AssetRepository";
import type { IAsset } from "@/models/Asset";

// Root sees every realtor's assets via list(); Administrator/Operator are scoped to their own via
// listForRealtor() — same split as the old PropertyService/LandService this replaces.
export class AssetService {
  static async list() {
    await connectDB();
    return assetRepository.findAll();
  }

  static async listForRealtor(realtorId: string, isLand?: boolean) {
    await connectDB();
    return assetRepository.findByRealtorId(realtorId, isLand);
  }

  static async countForRealtor(realtorId: string, isLand: boolean) {
    await connectDB();
    return assetRepository.countByRealtorId(realtorId, isLand);
  }

  // Used by the Client View Page's "Owns" tab — see CLAUDE.md → "Owns (Client)".
  static async listForClient(clientId: string) {
    await connectDB();
    return assetRepository.findByClientId(clientId);
  }

  // Backs TagService.remove() — see CLAUDE.md → "Tags".
  static async removeTagFromAll(tagId: string) {
    await connectDB();
    return assetRepository.pullTagFromAll(tagId);
  }

  // Backs GET /api/public/assets — see PUBLIC_API.md.
  static async listPublicForRealtor(realtorId: string, filters: PublicAssetFilters) {
    await connectDB();
    return assetRepository.findPublicByRealtorId(realtorId, filters);
  }

  // Backs GET /api/public/assets/[id] — see PUBLIC_API.md.
  static async getPublicForRealtor(id: string, realtorId: string) {
    await connectDB();
    return assetRepository.findPublicByIdForRealtor(id, realtorId);
  }

  static async get(id: string) {
    await connectDB();
    return assetRepository.findById(id);
  }

  static async create(data: Partial<IAsset>) {
    await connectDB();
    return assetRepository.create(data);
  }

  static async update(id: string, data: Partial<IAsset>) {
    await connectDB();
    return assetRepository.update(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return assetRepository.delete(id);
  }
}
