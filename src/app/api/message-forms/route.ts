import { NextResponse } from "next/server";
import { MessageFormService } from "@/services/MessageFormService";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

// Root-only by convention (managed as an action on the Realtors section, see
// components/realtors/RealtorMessageFormsPage.tsx) — same "no server-side check yet" gap as
// every other route in this repo.
// TODO: gate with a real Root-role check once route-level auth middleware lands.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const realtorId = searchParams.get("realtorId");

    const data = realtorId
      ? await MessageFormService.listForRealtor(realtorId)
      : await MessageFormService.list();
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/message-forms error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const realtorId = body.realtorId;
    const slug = body.slug?.trim();
    const subject = body.subject?.trim();
    const recipient = body.recipient?.trim().toLowerCase();

    if (!realtorId) return NextResponse.json({ message: "realtorId is required" }, { status: 400 });
    if (!slug) return NextResponse.json({ message: "Slug is required" }, { status: 400 });
    if (!subject) return NextResponse.json({ message: "Subject is required" }, { status: 400 });
    if (!recipient) return NextResponse.json({ message: "Recipient is required" }, { status: 400 });

    const realtor = await RealtorService.get(realtorId);
    if (!realtor) return NextResponse.json({ message: "Realtor not found" }, { status: 400 });

    const data = await MessageFormService.create({ realtorId, slug, subject, recipient });

    await LogEntryService.info({
      category: "MessageForms",
      message: `Message form "${data.slug}" was created for realtor ${realtor.firstName} ${realtor.lastName}`,
      userId: await getCurrentUserId(),
      realtorId,
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/message-forms error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
