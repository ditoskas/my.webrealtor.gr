import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOADS_PUBLIC_URL,
  realtorImageUploadDir,
  realtorImageUploadUrlPrefix,
  resolveUploadPath,
} from "@/lib/uploads";

// Best-effort — a missing/already-gone file on disk must never block replacing/clearing imageUrl,
// same discipline as AttachmentService.remove().
async function removeOldImage(url: string | null | undefined) {
  if (!url || !url.startsWith(UPLOADS_PUBLIC_URL)) return;
  const relative = url.slice(UPLOADS_PUBLIC_URL.length);
  const filePath = resolveUploadPath(relative.split("/").filter(Boolean));
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (error) {
    console.error("Failed to remove realtor image file from disk", error);
  }
}

// Uploads (or replaces) a Realtor's single profile photo — see models/Realtor.ts's `imageUrl` and
// CLAUDE.md → "Realtor management". Deliberately its own endpoint rather than folded into the
// generic PUT /api/realtors/[id] (which is JSON, not multipart, and never touches this field — see
// that route's own comment).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await RealtorService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const extension = ALLOWED_IMAGE_TYPES[file.type];
    if (!extension) {
      return NextResponse.json({ message: `Unsupported file type: ${file.type || "unknown"}` }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ message: "Image exceeds the 10MB upload limit" }, { status: 400 });
    }

    const targetDir = realtorImageUploadDir(id);
    await mkdir(targetDir, { recursive: true });
    await removeOldImage(existing.imageUrl);

    const filename = `${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(targetDir, filename), buffer);

    const imageUrl = `${realtorImageUploadUrlPrefix(id)}/${filename}`;
    const data = await RealtorService.update(id, { imageUrl });

    await LogEntryService.info({
      category: "Realtors",
      message: `Realtor ${existing.firstName} ${existing.lastName} image updated`,
      userId: await getCurrentUserId(),
      realtorId: id,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("POST /api/realtors/[id]/image error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await RealtorService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await removeOldImage(existing.imageUrl);
    const data = await RealtorService.update(id, { imageUrl: null });

    await LogEntryService.info({
      category: "Realtors",
      message: `Realtor ${existing.firstName} ${existing.lastName} image removed`,
      userId: await getCurrentUserId(),
      realtorId: id,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("DELETE /api/realtors/[id]/image error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
