import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { messageRepository } from "@/repositories/MessageRepository";
import { MessageFormService } from "./MessageFormService";
import { sendMail } from "@/lib/mail";
import type { IMessageForm } from "@/models/MessageForm";

const MAX_MESSAGE_KEYS = 100;

// A submitted form's key/value payload — see PUBLIC_API.md for the exact request contract.
export type MessagePayload = Record<string, unknown>;

export type ReceiveResult =
  | { status: "invalid-guid" }
  | { status: "invalid-body" }
  | { status: "ok"; form: IMessageForm; message: Awaited<ReturnType<typeof messageRepository.create>> };

// Renders a submitted payload as plain "key: value" lines inside a <pre> block — sendMail only
// accepts `html` (see lib/mail.ts), so this is how a literal "text email" is produced without
// changing that shared helper's contract for every other caller.
function buildKeyValueEmailHtml(slug: string, payload: MessagePayload): string {
  const lines = Object.entries(payload)
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join("\n");
  return `<p>New message received via "${slug}"</p><pre>${lines}</pre>`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Administrator/Operator are scoped to their own realtorId; Root sees everyone's — same
// convention as ClientService/MessageFormService.
export class MessageService {
  static async list(page = 1, pageSize = 100) {
    await connectDB();
    return messageRepository.findPaginated({}, page, pageSize);
  }

  static async listForRealtor(realtorId: string, page = 1, pageSize = 100) {
    await connectDB();
    return messageRepository.findPaginated({ realtorId }, page, pageSize);
  }

  static async get(id: string) {
    await connectDB();
    return messageRepository.findById(id);
  }

  static async remove(id: string) {
    await connectDB();
    return messageRepository.delete(id);
  }

  // Core action behind POST /api/public/message — resolves the guid, stores the Message, and
  // best-effort emails the form's recipient. A failed send never fails the request: the message
  // is already durably stored by the time sendMail is attempted (same discipline as
  // LogEntryService/PriceHistoryService — see CLAUDE.md → "Footer notifications"/"Logging").
  static async receive(guid: string, payload: unknown): Promise<ReceiveResult> {
    await connectDB();

    if (!isPlainObject(payload) || Object.keys(payload).length === 0) return { status: "invalid-body" };
    if (Object.keys(payload).length > MAX_MESSAGE_KEYS) return { status: "invalid-body" };

    const form = await MessageFormService.findByGuid(guid);
    if (!form) return { status: "invalid-guid" };

    const message = await messageRepository.create({
      realtorId: form.realtorId,
      messageFormId: new mongoose.Types.ObjectId(form.id as string),
      slug: form.slug,
      subject: form.subject,
      recipient: form.recipient,
      body: payload,
      emailSent: false,
    });

    const emailSent = await sendMail({
      to: form.recipient,
      subject: form.subject,
      html: buildKeyValueEmailHtml(form.slug, payload),
    });
    if (emailSent) {
      message.emailSent = true;
      await message.save();
    }

    return { status: "ok", form, message };
  }
}
