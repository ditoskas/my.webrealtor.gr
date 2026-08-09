import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { TransactionService } from "@/services/TransactionService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { TRANSACTION_FILE_KINDS, type TransactionFileKind } from "@/lib/types";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOADS_PUBLIC_URL,
  resolveUploadPath,
  transactionFileUploadDir,
  transactionFileUploadUrlPrefix,
} from "@/lib/uploads";

// Best-effort — a missing/already-gone file on disk must never block replacing/clearing the field,
// same discipline as AttachmentService.remove() / the realtor image route.
async function removeOldFile(url: string | null | undefined) {
  if (!url || !url.startsWith(UPLOADS_PUBLIC_URL)) return;
  const relative = url.slice(UPLOADS_PUBLIC_URL.length);
  const filePath = resolveUploadPath(relative.split("/").filter(Boolean));
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (error) {
    console.error("Failed to remove transaction file from disk", error);
  }
}

function fieldForKind(kind: TransactionFileKind): "receiptUrl" | "contractUrl" {
  return kind === "receipt" ? "receiptUrl" : "contractUrl";
}

// Uploads (or replaces) one of a Transaction's two file slots — see models/Transaction.ts and
// CLAUDE.md → "Transactions". Deliberately its own endpoint, not folded into the generic
// PUT /api/transactions/[id] (JSON, not multipart, and never touches these fields).
export async function POST(request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  try {
    const { id, kind } = await params;
    if (!TRANSACTION_FILE_KINDS.includes(kind as TransactionFileKind)) {
      return NextResponse.json({ message: "Invalid file kind" }, { status: 400 });
    }
    const fileKind = kind as TransactionFileKind;

    const existing = await TransactionService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const extension = ALLOWED_ATTACHMENT_TYPES[file.type];
    if (!extension) {
      return NextResponse.json({ message: `Unsupported file type: ${file.type || "unknown"}` }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ message: "File exceeds the 10MB upload limit" }, { status: 400 });
    }

    const field = fieldForKind(fileKind);
    const targetDir = transactionFileUploadDir(id, fileKind);
    await mkdir(targetDir, { recursive: true });
    await removeOldFile(existing[field]);

    const filename = `${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(targetDir, filename), buffer);

    const url = `${transactionFileUploadUrlPrefix(id, fileKind)}/${filename}`;
    const data = await TransactionService.update(id, { [field]: url });

    await LogEntryService.info({
      category: "Transactions",
      message: `Transaction ${fileKind} file uploaded`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("POST /api/transactions/[id]/files/[kind] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  try {
    const { id, kind } = await params;
    if (!TRANSACTION_FILE_KINDS.includes(kind as TransactionFileKind)) {
      return NextResponse.json({ message: "Invalid file kind" }, { status: 400 });
    }
    const fileKind = kind as TransactionFileKind;

    const existing = await TransactionService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const field = fieldForKind(fileKind);
    await removeOldFile(existing[field]);
    const data = await TransactionService.update(id, { [field]: null });

    await LogEntryService.info({
      category: "Transactions",
      message: `Transaction ${fileKind} file removed`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id]/files/[kind] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
