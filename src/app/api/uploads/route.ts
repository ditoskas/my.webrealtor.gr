import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  isValidObjectIdSegment,
  listingUploadDir,
  listingUploadUrlPrefix,
} from "@/lib/uploads";
import type { PropertyImage } from "@/lib/types";

// Not tied to a Property/Land document — this just persists files to disk (under
// <UPLOADS_DIR>/realtors/<realtorId>/<listingId>/, see lib/uploads.ts) and hands back { id, url }
// pairs for the caller (the dedicated media page) to attach to a listing via
// PUT /api/properties/[id]/images or PUT /api/lands/[id]/images, which is where the resulting
// LogEntry gets written (this route doesn't touch Mongo at all). realtorId/listingId come from the
// media page's already-loaded Property/Land, not user-typed input, but are still validated as
// ObjectId-shaped before being used as path segments.
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
    const realtorId = formData.get("realtorId");
    const listingId = formData.get("listingId");

    if (files.length === 0) {
      return NextResponse.json({ message: "No files provided" }, { status: 400 });
    }
    if (!isValidObjectIdSegment(realtorId) || !isValidObjectIdSegment(listingId)) {
      return NextResponse.json({ message: "realtorId and listingId are required" }, { status: 400 });
    }

    const targetDir = listingUploadDir(realtorId, listingId);
    await mkdir(targetDir, { recursive: true });

    const uploaded: PropertyImage[] = [];
    for (const file of files) {
      const extension = ALLOWED_IMAGE_TYPES[file.type];
      if (!extension) {
        return NextResponse.json({ message: `Unsupported file type: ${file.type || "unknown"}` }, { status: 400 });
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json({ message: `${file.name} exceeds the 10MB upload limit` }, { status: 400 });
      }

      const id = randomUUID();
      const filename = `${id}.${extension}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(targetDir, filename), buffer);

      uploaded.push({
        id,
        url: `${listingUploadUrlPrefix(realtorId, listingId)}/${filename}`,
        alt: "",
        description: "",
      });
    }

    return NextResponse.json({ data: uploaded, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/uploads error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
