import { NextResponse } from "next/server";
import { MessageFormService } from "@/services/MessageFormService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

// Root-only by convention — see app/api/message-forms/route.ts.

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await MessageFormService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const slug = body.slug?.trim();
    const subject = body.subject?.trim();
    const recipient = body.recipient?.trim().toLowerCase();

    if (!slug) return NextResponse.json({ message: "Slug is required" }, { status: 400 });
    if (!subject) return NextResponse.json({ message: "Subject is required" }, { status: 400 });
    if (!recipient) return NextResponse.json({ message: "Recipient is required" }, { status: 400 });

    // guid is deliberately never accepted from the body here — immutable once created.
    const data = await MessageFormService.update(id, { slug, subject, recipient });

    await LogEntryService.info({
      category: "MessageForms",
      message: `Message form "${existing.slug}" was updated`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/message-forms/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await MessageFormService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await MessageFormService.remove(id);

    await LogEntryService.info({
      category: "MessageForms",
      message: `Message form "${existing.slug}" was deleted`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/message-forms/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
