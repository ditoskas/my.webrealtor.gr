import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { TransactionService } from "@/services/TransactionService";
import { RealtorService } from "@/services/RealtorService";
import { ClientService } from "@/services/ClientService";
import { PropertyService } from "@/services/PropertyService";
import { LandService } from "@/services/LandService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { INTEREST_FOR_LISTING_TYPES, TRANSACTION_ACTIONS } from "@/lib/types";

// TODO: gate with real role checks once route-level auth middleware lands — same optional
// ?realtorId= scoping convention as /api/clients (see that route for the reasoning): the frontend
// decides whether to pass it (Administrator/Operator, per CLAUDE.md → "Data scoping by realtor")
// or omit it (Root, sees every realtor's).

function resolveListing(listingType: string, listingId: string) {
  return listingType === "Property" ? PropertyService.get(listingId) : LandService.get(listingId);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const realtorId = searchParams.get("realtorId");

    const data = realtorId ? await TransactionService.listForRealtor(realtorId) : await TransactionService.list();
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/transactions error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const realtorId = body.realtorId;
    const clientId = body.clientId;
    const date = body.date ? new Date(body.date) : null;
    const listingType = INTEREST_FOR_LISTING_TYPES.includes(body.listingType) ? body.listingType : null;
    const listingId = body.listingId;
    const action = TRANSACTION_ACTIONS.includes(body.action) ? body.action : null;
    const price = body.price !== undefined && body.price !== "" ? Number(body.price) : NaN;
    const commission = body.commission !== undefined && body.commission !== "" ? Number(body.commission) : NaN;
    const tax = body.tax !== undefined && body.tax !== "" ? Number(body.tax) : 0;

    if (!realtorId) return NextResponse.json({ message: "realtorId is required" }, { status: 400 });
    if (!clientId) return NextResponse.json({ message: "Client is required" }, { status: 400 });
    if (!date || Number.isNaN(date.getTime())) {
      return NextResponse.json({ message: "Date is required" }, { status: 400 });
    }
    if (!listingType) return NextResponse.json({ message: "Type is required" }, { status: 400 });
    if (!listingId) return NextResponse.json({ message: "Property or Land is required" }, { status: 400 });
    if (!action) return NextResponse.json({ message: "Action is required" }, { status: 400 });
    if (Number.isNaN(price)) return NextResponse.json({ message: "Price is required" }, { status: 400 });
    if (Number.isNaN(commission)) return NextResponse.json({ message: "Commission is required" }, { status: 400 });

    const realtor = await RealtorService.get(realtorId);
    if (!realtor) return NextResponse.json({ message: "Realtor not found" }, { status: 400 });

    const client = await ClientService.get(clientId);
    if (!client) return NextResponse.json({ message: "Client not found" }, { status: 400 });

    const listing = await resolveListing(listingType, listingId);
    if (!listing) return NextResponse.json({ message: "Listing not found" }, { status: 400 });

    const data = await TransactionService.create({
      realtorId: new mongoose.Types.ObjectId(realtorId),
      clientId: new mongoose.Types.ObjectId(clientId),
      date,
      listingType,
      listingId: new mongoose.Types.ObjectId(listingId),
      action,
      price,
      commission,
      tax: Number.isNaN(tax) ? 0 : tax,
      comment: typeof body.comment === "string" ? body.comment.trim() : "",
    });

    // Mark the listing inactive — the deal is done, so the listing is no longer available.
    // Best-effort: a status-update failure must never prevent the transaction from being recorded.
    try {
      if (listingType === "Property") {
        await PropertyService.update(listingId, { status: "inactive" });
      } else {
        await LandService.update(listingId, { status: "inactive" });
      }
    } catch (err) {
      console.error("POST /api/transactions: failed to set listing inactive", err);
    }

    await LogEntryService.info({
      category: "Transactions",
      message: `Transaction (${action}) recorded for client ${client.firstName} ${client.lastName}`,
      userId: await getCurrentUserId(),
      realtorId,
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
