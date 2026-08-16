import type { QueryFilter } from "mongoose";
import { Property, type IProperty } from "@/models/Property";
import type { TransactionType } from "@/lib/types";
import { BaseRepository } from "./BaseRepository";

export interface PublicPropertyFilters {
  propertyCategoryId?: string;
  transactionType?: TransactionType;
  minPrice?: number;
  maxPrice?: number;
}

class PropertyRepository extends BaseRepository<IProperty> {
  constructor() {
    super(Property);
  }

  findByRealtorId(realtorId: string) {
    return this.model.find({ realtorId }).sort({ createdAt: -1 }).exec();
  }

  countByRealtorId(realtorId: string) {
    return this.model.countDocuments({ realtorId }).exec();
  }

  findByClientId(clientId: string) {
    return this.model.find({ clientId }).sort({ createdAt: -1 }).exec();
  }

  // Backs GET /api/public/properties — see PUBLIC_API.md. Always restricted to active/pending
  // listings (never inactive) — that scoping is fixed, not one of the caller's filters.
  findPublicByRealtorId(realtorId: string, filters: PublicPropertyFilters) {
    const query: QueryFilter<IProperty> = {
      realtorId,
      status: { $in: ["active", "pending"] },
    };
    if (filters.propertyCategoryId) query.propertyCategoryId = filters.propertyCategoryId;
    if (filters.transactionType) query.transactionType = filters.transactionType;
    if (filters.minPrice != null || filters.maxPrice != null) {
      const price: { $gte?: number; $lte?: number } = {};
      if (filters.minPrice != null) price.$gte = filters.minPrice;
      if (filters.maxPrice != null) price.$lte = filters.maxPrice;
      query.price = price;
    }
    return this.model.find(query).populate("propertyCategoryId", "name slug").sort({ createdAt: -1 }).exec();
  }
}

export const propertyRepository = new PropertyRepository();
