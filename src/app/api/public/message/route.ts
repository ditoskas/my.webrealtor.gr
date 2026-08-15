import { NextResponse } from "next/server";
import { MessageService } from "@/services/MessageService";
import { LogEntryService } from "@/services/LogEntryService";
import { PublicApiResponse } from "@/lib/publicApiResponse";

// The one deliberately-public, unauthenticated, cross-origin endpoint in this app — see
// PUBLIC_API.md for the full third-party-facing contract. Everything else under /api/** is
// internal-only (only ever called by this app's own frontend), even though route-level auth
// isn't wired up anywhere yet (CLAUDE.md's still-open TODO).
//
// CORS is required (and new to this repo) because the caller is an external realtor's own
// website, a different origin than my.webrealtor.gr.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const guid = typeof body?.guid === "string" ? body.guid.trim() : "";
    const message = body?.message;

    if (!guid) {
      await LogEntryService.warning({
        category: "Messages",
        message: "Public message submission rejected: missing guid",
      });
      return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
    }

    const result = await MessageService.receive(guid, message);

    if (result.status === "invalid-guid") {
      await LogEntryService.warning({
        category: "Messages",
        message: "Public message submission rejected: unknown guid",
        dataFrom: { guid },
      });
      return PublicApiResponse.error("Not found").toResponse(404, CORS_HEADERS);
    }

    if (result.status === "invalid-body") {
      await LogEntryService.warning({
        category: "Messages",
        message: "Public message submission rejected: invalid message body",
        realtorId: null,
        dataFrom: { guid },
      });
      return PublicApiResponse.error("Invalid request").toResponse(400, CORS_HEADERS);
    }

    await LogEntryService.info({
      category: "Messages",
      message: `Message received via "${result.form.slug}"`,
      realtorId: result.form.realtorId.toString(),
      dataTo: result.message.toJSON() as unknown as Record<string, unknown>,
    });

    return PublicApiResponse.success(null, "Message received").toResponse(201, CORS_HEADERS);
  } catch (error) {
    console.error("POST /api/public/message error", error);
    return PublicApiResponse.error("Internal server error").toResponse(500, CORS_HEADERS);
  }
}
