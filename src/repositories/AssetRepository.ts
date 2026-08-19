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

  // Backs GET /api/public/assets — see PUBLIC_API.md. Always restricted to active/pending,
  // *published* listings (never inactive, never a null publishedAt) — that scoping is fixed, not
  // one of the caller's filters. Sorted by publish date (most recent first), not createdAt — the
  // public-facing order is "what went live most recently", independent of when it was first
  // entered into the system.
  findPublicByRealtorId(realtorId: string, filters: PublicAssetFilters) {
    const query: QueryFilter<IAsset> = {
      realtorId,
      status: { $in: ["active", "pending"] },
      publishedAt: { $ne: null },
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
      .sort({ publishedAt: -1 })
      .exec();
  }

  // Backs GET /api/public/assets/[id] — see PUBLIC_API.md. Same active/pending + published-only
  // scoping as findPublicByRealtorId above, plus realtorId, so a caller can't fetch another
  // realtor's asset (or an inactive/unpublished one) just by guessing an id — the id alone is
  // never sufficient.
  findPublicByIdForRealtor(id: string, realtorId: string) {
    return this.model
      .findOne({ _id: id, realtorId, status: { $in: ["active", "pending"] }, publishedAt: { $ne: null } })
      .populate("propertyCategoryId", "name slug")
      .populate("landCategoryId", "name slug")
      .exec();
  }

  // Backs GET /api/public/recent/[size] — see PUBLIC_API.md. Most recently *published* listings
  // across both kinds, for a "latest listings" widget — same active/pending + published-only
  // scoping as every other public endpoint, capped to `limit` and sorted newest-published-first.
  findRecentPublishedByRealtorId(realtorId: string, limit: number) {
    return this.model
      .find({ realtorId, status: { $in: ["active", "pending"] }, publishedAt: { $ne: null } })
      .populate("propertyCategoryId", "name slug")
      .populate("landCategoryId", "name slug")
      .sort({ publishedAt: -1 })
      .limit(limit)
      .exec();
  }

  // Backs GET /api/public/similar/[assetId] — see PUBLIC_API.md. Unpopulated: used internally
  // only, to read the reference asset's own category id before building the candidates query
  // below — a populated category ref can't be reused directly as a filter value. Published-only,
  // same as every other public endpoint — an unpublished reference is treated as not found.
  findActiveByIdForRealtor(id: string, realtorId: string) {
    return this.model
      .findOne({ _id: id, realtorId, status: { $in: ["active", "pending"] }, publishedAt: { $ne: null } })
      .exec();
  }

  // Backs GET /api/public/similar/[assetId] — see PUBLIC_API.md. Same realtor + active/pending +
  // published-only scoping as findPublicByRealtorId, plus the reference asset's own kind (isLand)
  // and action (transactionType); category is optional so the caller can drop it and re-query
  // once same-category candidates run under AssetService.SIMILAR_ASSET_LIMIT.
  findSimilarCandidates(filters: {
    realtorId: string;
    isLand: boolean;
    transactionType: TransactionType;
    excludeId: string;
    categoryId?: string;
  }) {
    const query: QueryFilter<IAsset> = {
      realtorId: filters.realtorId,
      isLand: filters.isLand,
      transactionType: filters.transactionType,
      status: { $in: ["active", "pending"] },
      publishedAt: { $ne: null },
      _id: { $ne: filters.excludeId },
    };
    if (filters.categoryId) {
      if (filters.isLand) query.landCategoryId = filters.categoryId;
      else query.propertyCategoryId = filters.categoryId;
    }
    return this.model
      .find(query)
      .populate("propertyCategoryId", "name slug")
      .populate("landCategoryId", "name slug")
      .exec();
  }
}

export const assetRepository = new AssetRepository();
