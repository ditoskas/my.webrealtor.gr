import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ClientService } from "@/services/ClientService";
import { ViewingService } from "@/services/ViewingService";
import { AssetService } from "@/services/AssetService";
import { AttachmentService } from "@/services/AttachmentService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { INTEREST_FOR_LISTING_TYPES } from "@/lib/types";

async function resolveSignatureDocument(clientId: string, signatureDocumentId: string) {
  const attachment = await AttachmentService.get(signatureDocumentId);
  if (!attachment || attachment.entityType !== "Client" || attachment.entityId.toString() !== clientId) {
    return null;
  }
  return attachment;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; viewingId: string }> }
) {
  try {
    const { viewingId } = await params;
    const data = await ViewingService.get(viewingId);
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/clients/[id]/viewings/[viewingId] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; viewingId: string }> }
) {
  try {
    const { id, viewingId } = await params;
    const client = await ClientService.get(id);
    if (!client) return NextResponse.json({ message: "Client not found" }, { status: 404 });

    const existing = await ViewingService.get(viewingId);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const body = await request.json();

    const date = body.date ? new Date(body.date) : null;
    const listingType = INTEREST_FOR_LISTING_TYPES.includes(body.listingType) ? body.listingType : null;
    const listingId = body.listingId;
    const signatureDocumentId = body.signatureDocumentId || null;

    if (!date || Number.isNaN(date.getTime())) {
      return NextResponse.json({ message: "Date is required" }, { status: 400 });
    }
    if (!listingType) return NextResponse.json({ message: "Type is required" }, { status: 400 });
    if (!listingId) return NextResponse.json({ message: "Property or Land is required" }, { status: 400 });

    const listing = await AssetService.get(listingId);
    if (!listing) return NextResponse.json({ message: "Listing not found" }, { status: 400 });

    if (signatureDocumentId && !(await resolveSignatureDocument(id, signatureDocumentId))) {
      return NextResponse.json({ message: "Signature document not found" }, { status: 400 });
    }

    const data = await ViewingService.update(viewingId, {
      date,
      listingType,
      listingId: new mongoose.Types.ObjectId(listingId),
      comment: body.comment?.trim() ?? "",
      signatureDocumentId: signatureDocumentId ? new mongoose.Types.ObjectId(signatureDocumentId) : null,
    });

    await LogEntryService.info({
      category: "Viewings",
      message: `Viewing updated for client ${client.firstName} ${client.lastName}`,
      userId: await getCurrentUserId(),
      realtorId: client.realtorId.toString(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
      dataTo: data?.toJSON() as unknown as Record<string, unknown> | undefined,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("PUT /api/clients/[id]/viewings/[viewingId] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; viewingId: string }> }
) {
  try {
    const { id, viewingId } = await params;
    const client = await ClientService.get(id);
    if (!client) return NextResponse.json({ message: "Client not found" }, { status: 404 });

    const existing = await ViewingService.get(viewingId);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await ViewingService.remove(viewingId);

    await LogEntryService.info({
      category: "Viewings",
      message: `Viewing deleted for client ${client.firstName} ${client.lastName}`,
      userId: await getCurrentUserId(),
      realtorId: client.realtorId.toString(),
      dataFrom: existing.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/clients/[id]/viewings/[viewingId] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
