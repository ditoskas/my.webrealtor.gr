import { connectDB } from "@/lib/mongodb";
import { tagRepository } from "@/repositories/TagRepository";
import { AssetService } from "./AssetService";
import type { ITag } from "@/models/Tag";

// Every realtor's own tag set — see CLAUDE.md → "Tags". No Root-vs-scoped split like most
// entities here (Root has no realtorId of its own, so it never owns a tag set — Tags are always
// reached through a specific realtor, either the session's own or, for Root, whichever realtor's
// Assets are being edited).
export class TagService {
  static async listForRealtor(realtorId: string) {
    await connectDB();
    return tagRepository.findByRealtorId(realtorId);
  }

  static async get(id: string) {
    await connectDB();
    return tagRepository.findById(id);
  }

  static async findByRealtorIdAndName(realtorId: string, name: string) {
    await connectDB();
    return tagRepository.findByRealtorIdAndName(realtorId, name);
  }

  static async create(data: Partial<ITag>) {
    await connectDB();
    return tagRepository.create(data);
  }

  static async update(id: string, data: Partial<ITag>) {
    await connectDB();
    return tagRepository.update(id, data);
  }

  // Hard delete (unlike the Settings pool entities' soft-delete) — a tag is a realtor's own
  // free-form label, not a shared/audited lookup value, so there's no history worth preserving.
  // Best-effort pulls the removed tag's id out of every Asset that still referenced it, so the
  // Assets UI never has to render a dangling tagId — see AssetService.removeTagFromAll().
  static async remove(id: string) {
    await connectDB();
    const tag = await tagRepository.delete(id);
    if (tag) {
      try {
        await AssetService.removeTagFromAll(id);
      } catch (error) {
        console.error("Failed to remove deleted tag from assets", error);
      }
    }
    return tag;
  }
}
