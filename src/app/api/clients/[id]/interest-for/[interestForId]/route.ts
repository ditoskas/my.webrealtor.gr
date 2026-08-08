import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ClientService } from "@/services/ClientService";
import { InterestForService } from "@/services/InterestForService";
import { PropertyCategoryService } from "@/services/PropertyCategoryService";
import { LandCategoryService } from "@/services/LandCategoryService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { TRANSACTION_TYPES, INTEREST_FOR_LISTING_TYPES } from "@/lib/types";

function resolveCategory(listingType: string, categoryId: string) {
  return listingType === "Property" ? PropertyCategoryService.get(categoryId) : LandCategoryService.get(categoryId);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; interestForId: string }> }
) {
  try {
    const { interestForId } = await params;
    const data = await InterestForService.get(interestForId);
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/clients/[id]/interest-for/[interestForId] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; interestForId: string }> }
) {
  try {
    const { id, interestForId } = await params;
    const client = await ClientService.get(id);
    if (!client) return NextResponse.json({ message: "Client not found" }, { status: 404 });

    const existing = await InterestForService.get(interestForId);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

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

    const data = await InterestForService.update(interestForId, {
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
      message: `Interest for entry updated for client ${client.firstName} ${client.lastName}`,
      userId: await getCurrentUserId(),
      realtorId: client.realtorId.toString(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/clients/[id]/interest-for/[interestForId] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; interestForId: string }> }
) {
  try {
    const { id, interestForId } = await params;
    const client = await ClientService.get(id);
    if (!client) return NextResponse.json({ message: "Client not found" }, { status: 404 });

    const existing = await InterestForService.get(interestForId);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await InterestForService.remove(interestForId);

    await LogEntryService.info({
      category: "InterestFor",
      message: `Interest for entry deleted for client ${client.firstName} ${client.lastName}`,
      userId: await getCurrentUserId(),
      realtorId: client.realtorId.toString(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/clients/[id]/interest-for/[interestForId] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
