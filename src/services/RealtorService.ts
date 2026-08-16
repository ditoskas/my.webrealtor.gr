import { connectDB } from "@/lib/mongodb";
import { realtorRepository } from "@/repositories/RealtorRepository";
import { ClientService } from "./ClientService";
import { PropertyService } from "./PropertyService";
import { LandService } from "./LandService";
import type { IRealtor } from "@/models/Realtor";

// Admin manages every realtor; a Realtor-role caller should be scoped to their own
// record by the route handler (via findByUserId) before reaching here.
export class RealtorService {
  // clientCount/propertyCount/landCount are computed here, not stored on the Realtor document —
  // one response from the client's perspective (no per-realtor stats endpoint), computed with
  // parallel `countDocuments` calls per realtor server-side. Fine at the realtor counts this
  // app deals with; revisit with a single aggregation query if that stops being true.
  static async list() {
    await connectDB();
    const realtors = await realtorRepository.findAll();

    return Promise.all(
      realtors.map(async (realtor) => {
        const [clientCount, propertyCount, landCount] = await Promise.all([
          ClientService.countForRealtor(realtor.id),
          PropertyService.countForRealtor(realtor.id),
          LandService.countForRealtor(realtor.id),
        ]);
        return {
          ...(realtor.toJSON() as unknown as Record<string, unknown>),
          clientCount,
          propertyCount,
          landCount,
        };
      })
    );
  }

  static async get(id: string) {
    await connectDB();
    return realtorRepository.findById(id);
  }

  static async findByEmail(email: string) {
    await connectDB();
    return realtorRepository.findByEmail(email);
  }

  // Resolves the credential GET /api/public/properties receives — see PUBLIC_API.md.
  static async findByGuid(guid: string) {
    await connectDB();
    return realtorRepository.findByGuid(guid);
  }

  static async create(data: Partial<IRealtor>) {
    await connectDB();
    return realtorRepository.create(data);
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
