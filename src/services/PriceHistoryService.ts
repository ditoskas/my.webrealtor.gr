import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { priceHistoryRepository } from "@/repositories/PriceHistoryRepository";
import type { PriceHistoryListingType } from "@/lib/types";

interface RecordParams {
  listingId: string;
  listingType: PriceHistoryListingType;
  price: number;
  currency: string;
  userId?: string | null;
}

/**
 * Appends one price-history entry per listing creation and per price change on update — see
 * CLAUDE.md → "Price History". Append-only, never edited/deleted, same audit-trail spirit as
 * LogEntry. Recording is best-effort: a failure here must never break the property/land save it
 * rides along with.
 */
export class PriceHistoryService {
  static async record({ listingId, listingType, price, currency, userId }: RecordParams) {
    try {
      await connectDB();
      await priceHistoryRepository.create({
        listingId: new mongoose.Types.ObjectId(listingId),
        listingType,
        price,
        currency,
        userId: userId ? new mongoose.Types.ObjectId(userId) : null,
      });
    } catch (error) {
      console.error("Failed to write price history entry", error);
    }
  }

  static async listForListing(listingId: string, listingType: PriceHistoryListingType) {
    await connectDB();
    return priceHistoryRepository.findByListing(listingId, listingType);
  }
}
