import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ClientService } from "@/services/ClientService";
import { ViewingService } from "@/services/ViewingService";
import { PropertyService } from "@/services/PropertyService";
import { LandService } from "@/services/LandService";
import { AttachmentService } from "@/services/AttachmentService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { INTEREST_FOR_LISTING_TYPES } from "@/lib/types";

// TODO: gate with real role checks once route-level auth middleware lands — see CLAUDE.md.
// Nested under /api/clients/[id]/viewings since Viewing always belongs to exactly one Client, same
// per-parent nesting InterestFor uses under /api/clients/[id]/interest-for.

function resolveListing(listingType: string, listingId: string) {
  return listingType === "Property" ? PropertyService.get(listingId) : LandService.get(listingId);
}

// signatureDocumentId, when provided, must reference an Attachment already uploaded to this same
// Client via the Files flow (POST /api/attachments) — not an arbitrary/other-entity attachment id.
async function resolveSignatureDocument(clientId: string, signatureDocumentId: string) {
  const attachment = await AttachmentService.get(signatureDocumentId);
  if (!attachment || attachment.entityType !== "Client" || attachment.entityId.toString() !== clientId) {
    return null;
  }
  return attachment;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await ClientService.get(id);
    if (!client) return NextResponse.json({ message: "Client not found" }, { status: 404 });

    const data = await ViewingService.listForClient(id);
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/clients/[id]/viewings error", error);
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
    const listingType = INTEREST_FOR_LISTING_TYPES.includes(body.listingType) ? body.listingType : null;
    const listingId = body.listingId;
    const signatureDocumentId = body.signatureDocumentId || null;

    if (!date || Number.isNaN(date.getTime())) {
      return NextResponse.json({ message: "Date is required" }, { status: 400 });
    }
    if (!listingType) return NextResponse.json({ message: "Type is required" }, { status: 400 });
    if (!listingId) return NextResponse.json({ message: "Property or Land is required" }, { status: 400 });

    const listing = await resolveListing(listingType, listingId);
    if (!listing) return NextResponse.json({ message: "Listing not found" }, { status: 400 });

    if (signatureDocumentId && !(await resolveSignatureDocument(id, signatureDocumentId))) {
      return NextResponse.json({ message: "Signature document not found" }, { status: 400 });
    }

    const data = await ViewingService.create({
      clientId: new mongoose.Types.ObjectId(id),
      date,
      listingType,
      listingId: new mongoose.Types.ObjectId(listingId),
      comment: body.comment?.trim() ?? "",
      signatureDocumentId: signatureDocumentId ? new mongoose.Types.ObjectId(signatureDocumentId) : null,
    });

    await LogEntryService.info({
      category: "Viewings",
      message: `Viewing recorded for client ${client.firstName} ${client.lastName}`,
      userId: await getCurrentUserId(),
      realtorId: client.realtorId.toString(),
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/clients/[id]/viewings error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
