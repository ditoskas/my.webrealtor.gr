import { NextResponse } from "next/server";
import { NoteService } from "@/services/NoteService";
import { RealtorService } from "@/services/RealtorService";
import { ClientService } from "@/services/ClientService";
import { AssetService } from "@/services/AssetService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { NOTE_ENTITY_TYPES, NOTE_IMPORTANCE_LEVELS, type NoteEntityType } from "@/lib/types";

// TODO: gate with real role checks once route-level auth middleware lands — same still-TODO gap
// as every other entity in this repo.

// Resolves the parent record a note is attached to — used both to validate entityId actually
// exists before creating a note, and to derive the realtorId a LogEntry for that note should be
// filed under (a Realtor's own id, or the realtorId of the Client/Asset it belongs to). "Property"
// and "Land" both resolve into the merged Asset collection now — see CLAUDE.md → "Asset
// management" — entityType keeps both string values purely as a display/historical tag.
async function resolveParent(
  entityType: NoteEntityType,
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
    case "Property":
    case "Land": {
      const asset = await AssetService.get(entityId);
      return { found: !!asset, realtorId: asset ? asset.realtorId.toString() : null };
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = NOTE_ENTITY_TYPES.find((type) => type === searchParams.get("entityType"));
    const entityId = searchParams.get("entityId");

    if (!entityType) return NextResponse.json({ message: "A valid entityType is required" }, { status: 400 });
    if (!entityId) return NextResponse.json({ message: "entityId is required" }, { status: 400 });

    const data = await NoteService.listForEntity(entityType, entityId);
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/notes error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entityType = NOTE_ENTITY_TYPES.find((type) => type === body.entityType);
    const entityId = typeof body.entityId === "string" ? body.entityId : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const importance = NOTE_IMPORTANCE_LEVELS.find((level) => level === body.importance) ?? "Normal";

    if (!entityType) return NextResponse.json({ message: "A valid entityType is required" }, { status: 400 });
    if (!entityId) return NextResponse.json({ message: "entityId is required" }, { status: 400 });
    if (!title) return NextResponse.json({ message: "Title is required" }, { status: 400 });
    if (!text) return NextResponse.json({ message: "Text is required" }, { status: 400 });

    const parent = await resolveParent(entityType, entityId);
    if (!parent.found) return NextResponse.json({ message: "Referenced record not found" }, { status: 400 });

    const userId = await getCurrentUserId();
    const data = await NoteService.create({ entityType, entityId, title, text, importance, userId });

    await LogEntryService.info({
      category: "Notes",
      message: `Note "${data.title}" was added to ${entityType} ${entityId}`,
      userId,
      realtorId: parent.realtorId,
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
