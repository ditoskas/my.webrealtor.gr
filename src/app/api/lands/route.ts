import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { LandService } from "@/services/LandService";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { PriceHistoryService } from "@/services/PriceHistoryService";
import { getCurrentUserId } from "@/lib/auth";
import { parseLandBody } from "./parseLandBody";

// TODO: gate with real role checks once route-level auth middleware lands — same optional
// ?realtorId= scoping convention as /api/properties (see that route for the reasoning): the
// frontend decides whether to pass it (Administrator/Operator) or omit it (Root, sees every
// realtor's). ?clientId= is a separate, mutually-exclusive filter used by the Client View Page's
// "Owns" tab — see CLAUDE.md → "Owns (Client)".

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const realtorId = searchParams.get("realtorId");
    const clientId = searchParams.get("clientId");

    const data = clientId
      ? await LandService.listForClient(clientId)
      : realtorId
        ? await LandService.listForRealtor(realtorId)
        : await LandService.list();
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/lands error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const realtorId = body.realtorId;

    if (!realtorId) return NextResponse.json({ message: "realtorId is required" }, { status: 400 });
    const realtor = await RealtorService.get(realtorId);
    if (!realtor) return NextResponse.json({ message: "Realtor not found" }, { status: 400 });

    const { errors, data: parsed } = parseLandBody(body);
    if (errors.length > 0) return NextResponse.json({ message: errors[0] }, { status: 400 });

    const data = await LandService.create({
      ...parsed,
      realtorId: new mongoose.Types.ObjectId(realtorId),
    });

    const userId = await getCurrentUserId();

    await LogEntryService.info({
      category: "Land",
      message: `Land listing "${data.title || data.id}" was created`,
      userId,
      realtorId,
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    await PriceHistoryService.record({
      listingId: data.id,
      listingType: "Land",
      price: data.price,
      currency: data.currency,
      userId,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/lands error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
