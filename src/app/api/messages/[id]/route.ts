import { NextResponse } from "next/server";
import { MessageService } from "@/services/MessageService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await MessageService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await MessageService.remove(id);

    await LogEntryService.info({
      category: "Messages",
      message: `Message "${existing.subject}" (${existing.slug}) was deleted`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/messages/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
