import { NextResponse } from "next/server";
import { AttachmentService } from "@/services/AttachmentService";
import { ClientService } from "@/services/ClientService";
import { PropertyService } from "@/services/PropertyService";
import { LandService } from "@/services/LandService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import type { AttachableEntityType } from "@/lib/types";

// Same parent-resolution reasoning as app/api/attachments/route.ts, but only the realtorId is
// needed here (existence was already established when the attachment was created).
async function resolveRealtorId(entityType: AttachableEntityType, entityId: string): Promise<string | null> {
  switch (entityType) {
    case "Realtor":
      return entityId;
    case "Client": {
      const client = await ClientService.get(entityId);
      return client ? client.realtorId.toString() : null;
    }
    case "Property": {
      const property = await PropertyService.get(entityId);
      return property ? property.realtorId.toString() : null;
    }
    case "Land": {
      const land = await LandService.get(entityId);
      return land ? land.realtorId.toString() : null;
    }
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await AttachmentService.get(id);
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/attachments/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Only title/description are editable — re-uploading a replacement file isn't supported, delete
// and add a new one instead (same as the Property/Land media manager's "Remove" + re-add flow).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await AttachmentService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!title) return NextResponse.json({ message: "Title is required" }, { status: 400 });

    const data = await AttachmentService.update(id, { title, description });
    const realtorId = await resolveRealtorId(existing.entityType, existing.entityId.toString());

    await LogEntryService.info({
      category: "Attachments",
      message: `Attachment "${existing.fileName}" was updated`,
      userId: await getCurrentUserId(),
      realtorId,
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/attachments/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await AttachmentService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await AttachmentService.remove(id);
    const realtorId = await resolveRealtorId(existing.entityType, existing.entityId.toString());

    await LogEntryService.info({
      category: "Attachments",
      message: `Attachment "${existing.fileName}" was deleted`,
      userId: await getCurrentUserId(),
      realtorId,
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/attachments/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
