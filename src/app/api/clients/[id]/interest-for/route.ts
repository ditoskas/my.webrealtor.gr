import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ClientService } from "@/services/ClientService";
import { InterestForService } from "@/services/InterestForService";
import { PropertyCategoryService } from "@/services/PropertyCategoryService";
import { LandCategoryService } from "@/services/LandCategoryService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { TRANSACTION_TYPES, INTEREST_FOR_LISTING_TYPES } from "@/lib/types";

// TODO: gate with real role checks once route-level auth middleware lands — see CLAUDE.md.
// Nested under /api/clients/[id]/interest-for since InterestFor always belongs to exactly one
// Client (unlike Notes/Attachments, which are polymorphic across four entity types) — same
// per-parent nesting PriceHistory uses under /api/properties/[id]/price-history.

function resolveCategory(listingType: string, categoryId: string) {
  return listingType === "Property" ? PropertyCategoryService.get(categoryId) : LandCategoryService.get(categoryId);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await ClientService.get(id);
    if (!client) return NextResponse.json({ message: "Client not found" }, { status: 404 });

    const data = await InterestForService.listForClient(id);
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/clients/[id]/interest-for error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await ClientService.get(id);
    if (!client) return NextResponse.json({ message: "Client not found" }, { status: 404 });

    const body = await request.json();

    const date = body.date ? new Date(body.date) : null;
    const transactionType = TRANSACTION_TYPES.includes(body.transactionType) ? body.transactionType : null;
    const listingType = INTEREST_FOR_LISTING_TYPES.includes(body.listingType) ? body.listingType : null;
    const categoryId = body.categoryId;
    const price = body.price !== undefined && body.price !== "" ? Number(body.price) : NaN;

    if (!date || Number.isNaN(date.getTime())) {
      return NextResponse.json({ message: "Date is required" }, { status: 400 });
    }
    if (!transactionType) return NextResponse.json({ message: "Transaction type is required" }, { status: 400 });
    if (!listingType) return NextResponse.json({ message: "Type is required" }, { status: 400 });
    if (!categoryId) return NextResponse.json({ message: "Category is required" }, { status: 400 });
    if (Number.isNaN(price)) return NextResponse.json({ message: "Price is required" }, { status: 400 });

    const category = await resolveCategory(listingType, categoryId);
    if (!category) return NextResponse.json({ message: "Category not found" }, { status: 400 });

    const data = await InterestForService.create({
      clientId: new mongoose.Types.ObjectId(id),
      date,
      transactionType,
      listingType,
      categoryId: new mongoose.Types.ObjectId(categoryId),
      price,
      city: body.city?.trim() ?? "",
      area: body.area !== undefined && body.area !== "" ? Number(body.area) : null,
      remarks: body.remarks?.trim() ?? "",
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    await LogEntryService.info({
      category: "InterestFor",
      message: `Interest for entry created for client ${client.firstName} ${client.lastName}`,
      userId: await getCurrentUserId(),
      realtorId: client.realtorId.toString(),
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/clients/[id]/interest-for error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
