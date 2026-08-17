import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { messageFormRepository } from "@/repositories/MessageFormRepository";

// Managed only by Root, as an action on the Realtors section (RealtorMessageFormsPage always
// calls listForRealtor for one fixed realtorId) — see CLAUDE.md → "Messages". list() exists for
// symmetry with the other pool-style services but currently has no caller.
export class MessageFormService {
  static async list() {
    await connectDB();
    return messageFormRepository.findAll();
  }

  static async listForRealtor(realtorId: string) {
    await connectDB();
    return messageFormRepository.findByRealtorId(realtorId);
  }

  static async get(id: string) {
    await connectDB();
    return messageFormRepository.findById(id);
  }

  static async findByGuid(guid: string) {
    await connectDB();
    return messageFormRepository.findByGuid(guid);
  }

  // `guid` is intentionally never accepted here — always server-generated (see
  // models/MessageForm.ts's schema default), so a caller can't set/predict it.
  static async create(data: { realtorId: string; slug: string; subject: string; recipient: string }) {
    await connectDB();
    return messageFormRepository.create({
      realtorId: new mongoose.Types.ObjectId(data.realtorId),
      slug: data.slug,
      subject: data.subject,
      recipient: data.recipient,
    });
  }

  static async update(id: string, data: { slug: string; subject: string; recipient: string }) {
    await connectDB();
    return messageFormRepository.update(id, data);
  }

  static async remove(id: string) {
    await connectDB();
    return messageFormRepository.delete(id);
  }
}
