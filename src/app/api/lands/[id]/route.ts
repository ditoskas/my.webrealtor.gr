import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { LandService } from "@/services/LandService";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { PriceHistoryService } from "@/services/PriceHistoryService";
import { getCurrentUserId } from "@/lib/auth";
import { parseLandBody } from "../parseLandBody";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await LandService.get(id);
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/lands/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await LandService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const realtorId = body.realtorId;
    if (!realtorId) return NextResponse.json({ message: "realtorId is required" }, { status: 400 });

    if (realtorId !== existing.realtorId.toString()) {
      const realtor = await RealtorService.get(realtorId);
      if (!realtor) return NextResponse.json({ message: "Realtor not found" }, { status: 400 });
    }

    const { errors, data: parsed } = parseLandBody(body);
    if (errors.length > 0) return NextResponse.json({ message: errors[0] }, { status: 400 });

    const data = await LandService.update(id, {
      ...parsed,
      realtorId: new mongoose.Types.ObjectId(realtorId),
    });

    const userId = await getCurrentUserId();

    await LogEntryService.info({
      category: "Land",
      message: `Land listing "${existing.title || existing.id}" was updated`,
      userId,
      realtorId,
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    if (data && data.price !== existing.price) {
      await PriceHistoryService.record({
        listingId: id,
        listingType: "Land",
        price: data.price,
        currency: data.currency,
        userId,
      });
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/lands/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await LandService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await LandService.remove(id);

    await LogEntryService.info({
      category: "Land",
      message: `Land listing "${existing.title || existing.id}" was deleted`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId.toString(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/lands/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
