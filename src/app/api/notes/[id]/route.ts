import { NextResponse } from "next/server";
import { NoteService } from "@/services/NoteService";
import { ClientService } from "@/services/ClientService";
import { AssetService } from "@/services/AssetService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { NOTE_IMPORTANCE_LEVELS, type NoteEntityType } from "@/lib/types";

// Same parent-resolution reasoning as app/api/notes/route.ts, but only the realtorId is needed
// here (existence was already established when the note was created).
async function resolveRealtorId(entityType: NoteEntityType, entityId: string): Promise<string | null> {
  switch (entityType) {
    case "Realtor":
      return entityId;
    case "Client": {
      const client = await ClientService.get(entityId);
      return client ? client.realtorId.toString() : null;
    }
    case "Property":
    case "Land": {
      const asset = await AssetService.get(entityId);
      return asset ? asset.realtorId.toString() : null;
    }
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await NoteService.get(id);
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/notes/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await NoteService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const importance = NOTE_IMPORTANCE_LEVELS.find((level) => level === body.importance) ?? existing.importance;

    if (!title) return NextResponse.json({ message: "Title is required" }, { status: 400 });
    if (!text) return NextResponse.json({ message: "Text is required" }, { status: 400 });

    const data = await NoteService.update(id, { title, text, importance });
    const realtorId = await resolveRealtorId(existing.entityType, existing.entityId.toString());

    await LogEntryService.info({
      category: "Notes",
      message: `Note "${existing.title}" was updated`,
      userId: await getCurrentUserId(),
      realtorId,
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/notes/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await NoteService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await NoteService.remove(id);
    const realtorId = await resolveRealtorId(existing.entityType, existing.entityId.toString());

    await LogEntryService.info({
      category: "Notes",
      message: `Note "${existing.title}" was deleted`,
      userId: await getCurrentUserId(),
      realtorId,
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notes/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
