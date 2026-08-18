import type { QueryFilter } from "mongoose";
import { Asset, type IAsset } from "@/models/Asset";
import type { TransactionType } from "@/lib/types";
import { BaseRepository } from "./BaseRepository";

export interface PublicAssetFilters {
  propertyCategoryId?: string;
  landCategoryId?: string;
  transactionType?: TransactionType;
  minPrice?: number;
  maxPrice?: number;
  isLand?: boolean;
  tagId?: string;
}

class AssetRepository extends BaseRepository<IAsset> {
  constructor() {
    super(Asset);
  }

  findByRealtorId(realtorId: string, isLand?: boolean) {
    const query: QueryFilter<IAsset> = { realtorId };
    if (isLand !== undefined) query.isLand = isLand;
    return this.model.find(query).sort({ createdAt: -1 }).exec();
  }

  countByRealtorId(realtorId: string, isLand: boolean) {
    return this.model.countDocuments({ realtorId, isLand }).exec();
  }

  findByClientId(clientId: string) {
    return this.model.find({ clientId }).sort({ createdAt: -1 }).exec();
  }

  // Backs TagService.remove()'s cascade cleanup — every Asset still carrying the deleted tag's id
  // in its `tagIds` array has just that entry pulled out, not the whole document touched otherwise.
  pullTagFromAll(tagId: string) {
    return this.model.updateMany({ tagIds: tagId }, { $pull: { tagIds: tagId } }).exec();
  }

  // Backs GET /api/public/assets — see PUBLIC_API.md. Always restricted to active/pending
  // listings (never inactive) — that scoping is fixed, not one of the caller's filters.
  findPublicByRealtorId(realtorId: string, filters: PublicAssetFilters) {
    const query: QueryFilter<IAsset> = {
      realtorId,
      status: { $in: ["active", "pending"] },
    };
    if (filters.isLand !== undefined) query.isLand = filters.isLand;
    if (filters.propertyCategoryId) query.propertyCategoryId = filters.propertyCategoryId;
    if (filters.landCategoryId) query.landCategoryId = filters.landCategoryId;
    if (filters.tagId) query.tagIds = filters.tagId;
    if (filters.transactionType) query.transactionType = filters.transactionType;
    if (filters.minPrice != null || filters.maxPrice != null) {
      const price: { $gte?: number; $lte?: number } = {};
      if (filters.minPrice != null) price.$gte = filters.minPrice;
      if (filters.maxPrice != null) price.$lte = filters.maxPrice;
      query.price = price;
    }
    return this.model
      .find(query)
      .populate("propertyCategoryId", "name slug")
      .populate("landCategoryId", "name slug")
      .sort({ createdAt: -1 })
      .exec();
  }

  // Backs GET /api/public/assets/[id] — see PUBLIC_API.md. Same active/pending-only scoping as
  // findPublicByRealtorId above, plus realtorId, so a caller can't fetch another realtor's asset
  // (or an inactive one) just by guessing an id — the id alone is never sufficient.
  findPublicByIdForRealtor(id: string, realtorId: string) {
    return this.model
      .findOne({ _id: id, realtorId, status: { $in: ["active", "pending"] } })
      .populate("propertyCategoryId", "name slug")
      .populate("landCategoryId", "name slug")
      .exec();
  }
}

export const assetRepository = new AssetRepository();
