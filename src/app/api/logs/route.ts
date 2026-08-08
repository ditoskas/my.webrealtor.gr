import { NextResponse } from "next/server";
import { LogEntryService } from "@/services/LogEntryService";

// Read-only on purpose — log entries are only ever written internally via
// LogEntryService.info/warning/error, never created directly through the API.
// TODO: gate with the Root-role check once route-level auth middleware lands.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") ?? "100", 10) || 100);

    const data = await LogEntryService.list(page, pageSize);
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/logs error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
