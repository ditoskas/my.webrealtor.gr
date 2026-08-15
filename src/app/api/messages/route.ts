import { NextResponse } from "next/server";
import { MessageService } from "@/services/MessageService";

// Read-only on purpose — Message rows are only ever created internally via
// POST /api/public/message, never directly through this resource.
// TODO: gate with real role checks once route-level auth middleware lands. For now the frontend
// decides whether to pass `realtorId` (Administrator/Operator, scoped to their own) or omit it
// (Root, sees every realtor's messages) — see components/messages/MessagesPage.tsx.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const realtorId = searchParams.get("realtorId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") ?? "100", 10) || 100);

    const data = realtorId
      ? await MessageService.listForRealtor(realtorId, page, pageSize)
      : await MessageService.list(page, pageSize);
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/messages error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
