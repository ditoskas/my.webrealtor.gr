import { connectDB } from "@/lib/mongodb";
import { assetRepository, type PublicAssetFilters } from "@/repositories/AssetRepository";
import type { IAsset } from "@/models/Asset";

// Backs GET /api/public/similar/[assetId] — see PUBLIC_API.md and AssetService.findSimilar below.
const SIMILAR_ASSET_LIMIT = 3;

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

  // Backs GET /api/public/similar/[assetId] — see PUBLIC_API.md. Matches on the reference asset's
  // own realtor, kind (isLand), and action (transactionType); prefers same-category candidates,
  // falling back to every category once same-category matches run under SIMILAR_ASSET_LIMIT, then
  // returns whichever set sorted by closeness in price to the reference. Returns null when the
  // reference asset doesn't exist, isn't this realtor's, or isn't active/pending — same "id alone
  // is never sufficient" contract as getPublicForRealtor.
  static async findSimilar(assetId: string, realtorId: string) {
    await connectDB();
    const reference = await assetRepository.findActiveByIdForRealtor(assetId, realtorId);
    if (!reference) return null;

    const categoryId = (reference.isLand ? reference.landCategoryId : reference.propertyCategoryId)?.toString();

    let candidates = await assetRepository.findSimilarCandidates({
      realtorId,
      isLand: reference.isLand,
      transactionType: reference.transactionType,
      excludeId: reference.id,
      categoryId,
    });

    if (candidates.length < SIMILAR_ASSET_LIMIT && categoryId) {
      candidates = await assetRepository.findSimilarCandidates({
        realtorId,
        isLand: reference.isLand,
        transactionType: reference.transactionType,
        excludeId: reference.id,
      });
    }

    return [...candidates]
      .sort((a, b) => Math.abs(a.price - reference.price) - Math.abs(b.price - reference.price))
      .slice(0, SIMILAR_ASSET_LIMIT);
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
