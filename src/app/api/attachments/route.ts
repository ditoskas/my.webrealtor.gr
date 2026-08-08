import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { AttachmentService } from "@/services/AttachmentService";
import { RealtorService } from "@/services/RealtorService";
import { ClientService } from "@/services/ClientService";
import { PropertyService } from "@/services/PropertyService";
import { LandService } from "@/services/LandService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  attachmentUploadDir,
  attachmentUploadUrlPrefix,
} from "@/lib/uploads";
import { ATTACHABLE_ENTITY_TYPES, type AttachableEntityType } from "@/lib/types";

// TODO: gate with real role checks once route-level auth middleware lands — same still-TODO gap as
// every other entity in this repo.

// Resolves the parent record an attachment belongs to — same reasoning and shape as
// app/api/notes/route.ts's resolveParent (validates entityId exists before upload, and derives the
// realtorId a LogEntry for this action should be filed under).
async function resolveParent(
  entityType: AttachableEntityType,
  entityId: string
): Promise<{ found: boolean; realtorId: string | null }> {
  switch (entityType) {
    case "Realtor": {
      const realtor = await RealtorService.get(entityId);
      return { found: !!realtor, realtorId: realtor ? realtor.id : null };
    }
    case "Client": {
      const client = await ClientService.get(entityId);
      return { found: !!client, realtorId: client ? client.realtorId.toString() : null };
    }
    case "Property": {
      const property = await PropertyService.get(entityId);
      return { found: !!property, realtorId: property ? property.realtorId.toString() : null };
    }
    case "Land": {
      const land = await LandService.get(entityId);
      return { found: !!land, realtorId: land ? land.realtorId.toString() : null };
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = ATTACHABLE_ENTITY_TYPES.find((type) => type === searchParams.get("entityType"));
    const entityId = searchParams.get("entityId");

    if (!entityType) return NextResponse.json({ message: "A valid entityType is required" }, { status: 400 });
    if (!entityId) return NextResponse.json({ message: "entityId is required" }, { status: 400 });

    const data = await AttachmentService.listForEntity(entityType, entityId);
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/attachments error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Multipart upload — one request can carry several files, each becoming its own Attachment
// document (title defaults to the original filename minus its extension, description starts
// empty; both are editable afterward, same "upload now, caption later" flow as the Property/Land
// media manager). Every file's type/size is validated up front before any of them are written, so
// a batch either fully succeeds or fails without partial writes.
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const entityType = ATTACHABLE_ENTITY_TYPES.find((type) => type === formData.get("entityType"));
    const entityId = formData.get("entityId");
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (!entityType) return NextResponse.json({ message: "A valid entityType is required" }, { status: 400 });
    if (typeof entityId !== "string" || !entityId) {
      return NextResponse.json({ message: "entityId is required" }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ message: "No files provided" }, { status: 400 });
    }

    const parent = await resolveParent(entityType, entityId);
    if (!parent.found) return NextResponse.json({ message: "Referenced record not found" }, { status: 400 });

    for (const file of files) {
      if (!ALLOWED_ATTACHMENT_TYPES[file.type]) {
        return NextResponse.json(
          { message: `"${file.name}" has an unsupported or disallowed file type (${file.type || "unknown"})` },
          { status: 400 }
        );
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json({ message: `${file.name} exceeds the 10MB upload limit` }, { status: 400 });
      }
    }

    const targetDir = attachmentUploadDir(entityType, entityId);
    await mkdir(targetDir, { recursive: true });

    const userId = await getCurrentUserId();
    const created = [];
    for (const file of files) {
      const extension = ALLOWED_ATTACHMENT_TYPES[file.type];
      const storedFilename = `${randomUUID()}.${extension}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(targetDir, storedFilename), buffer);

      const originalName = (file.name || storedFilename).slice(0, 200);
      const titleFallback = originalName.replace(/\.[^./\\]+$/, "") || originalName;

      const attachment = await AttachmentService.create({
        entityType,
        entityId,
        title: titleFallback,
        description: "",
        fileName: originalName,
        url: `${attachmentUploadUrlPrefix(entityType, entityId)}/${storedFilename}`,
        mimeType: file.type,
        size: file.size,
        userId,
      });
      created.push(attachment);
    }

    await LogEntryService.info({
      category: "Attachments",
      message: `${created.length} file(s) uploaded to ${entityType} ${entityId}`,
      userId,
      realtorId: parent.realtorId,
      dataTo: { fileNames: created.map((attachment) => attachment.fileName) },
    });

    return NextResponse.json({ data: created, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/attachments error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
