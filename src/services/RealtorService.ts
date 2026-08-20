import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { realtorRepository } from "@/repositories/RealtorRepository";
import { ClientService } from "./ClientService";
import { AssetService } from "./AssetService";
import { TagService } from "./TagService";
import type { IRealtor } from "@/models/Realtor";

// Every new realtor starts with one default tag — see CLAUDE.md → "Tags". Best-effort: a seeding
// failure must never break realtor creation itself, same discipline as PriceHistoryService.record.
async function seedDefaultTag(realtorId: string) {
  try {
    await TagService.create({ realtorId: new mongoose.Types.ObjectId(realtorId), name: "Recent" });
  } catch (error) {
    console.error(`Failed to seed default "Recent" tag for realtor ${realtorId}`, error);
  }
}

// Admin manages every realtor; a Realtor-role caller should be scoped to their own
// record by the route handler (via findByUserId) before reaching here.
export class RealtorService {
  // clientCount/propertyCount/landCount are computed here, not stored on the Realtor document —
  // one response from the client's perspective (no per-realtor stats endpoint), computed with
  // parallel `countDocuments` calls per realtor server-side. Fine at the realtor counts this
  // app deals with; revisit with a single aggregation query if that stops being true.
  private static async withCounts(realtor: IRealtor) {
    const [clientCount, propertyCount, landCount] = await Promise.all([
      ClientService.countForRealtor(realtor.id),
      AssetService.countForRealtor(realtor.id, false),
      AssetService.countForRealtor(realtor.id, true),
    ]);
    return {
      ...(realtor.toJSON() as unknown as Record<string, unknown>),
      clientCount,
      propertyCount,
      landCount,
    };
  }

  static async list() {
    await connectDB();
    const realtors = await realtorRepository.findAll();
    return Promise.all(realtors.map((realtor) => RealtorService.withCounts(realtor)));
  }

  static async get(id: string) {
    await connectDB();
    return realtorRepository.findById(id);
  }

  // Same shape as list()'s per-realtor entries — used by the Realtor View Page, which fetches a
  // single realtor rather than the list, and would otherwise never see clientCount/propertyCount/
  // landCount (get() intentionally stays count-free for every other, existence-check-only caller).
  static async getWithCounts(id: string) {
    await connectDB();
    const realtor = await realtorRepository.findById(id);
    if (!realtor) return null;
    return RealtorService.withCounts(realtor);
  }

  static async findByEmail(email: string) {
    await connectDB();
    return realtorRepository.findByEmail(email);
  }

  // Resolves the credential GET /api/public/assets receives — see PUBLIC_API.md.
  static async findByGuid(guid: string) {
    await connectDB();
    return realtorRepository.findByGuid(guid);
  }

  static async create(data: Partial<IRealtor>) {
    await connectDB();
    const realtor = await realtorRepository.create(data);
    await seedDefaultTag(realtor.id);
    return realtor;
  }

  static async update(id: string, data: Partial<IRealtor>) {
    await connectDB();
    return realtorRepository.update(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return realtorRepository.delete(id);
  }
}
