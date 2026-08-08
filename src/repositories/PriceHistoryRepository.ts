import { PriceHistory, type IPriceHistory } from "@/models/PriceHistory";
import type { PriceHistoryListingType } from "@/lib/types";
import { BaseRepository } from "./BaseRepository";

class PriceHistoryRepository extends BaseRepository<IPriceHistory> {
  constructor() {
    super(PriceHistory);
  }

  findByListing(listingId: string, listingType: PriceHistoryListingType) {
    return this.model.find({ listingId, listingType }).sort({ createdAt: -1 }).exec();
  }
}

export const priceHistoryRepository = new PriceHistoryRepository();
