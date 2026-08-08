import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { UserService } from "@/services/UserService";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { USER_ROLES } from "@/lib/types";

function withoutPassword(doc: { toJSON: () => unknown }) {
  const { password: _pw, ...safe } = doc.toJSON() as unknown as Record<string, unknown>;
  void _pw;
  return safe;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await UserService.get(id);
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/users/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await UserService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const email = body.email?.trim().toLowerCase();
    const role = USER_ROLES.includes(body.role) ? body.role : null;

    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });
    if (!role) return NextResponse.json({ message: "A valid role is required" }, { status: 400 });

    if (email !== existing.email) {
      const emailOwner = await UserService.findByEmail(email);
      if (emailOwner && emailOwner.id !== id) {
        return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
      }
    }

    let realtorId: string | null = null;
    if (role !== "Root") {
      realtorId = body.realtorId ?? null;
      if (!realtorId) {
        return NextResponse.json(
          { message: "realtorId is required for Administrator and Operator roles" },
          { status: 400 }
        );
      }
      const realtor = await RealtorService.get(realtorId);
      if (!realtor) return NextResponse.json({ message: "Realtor not found" }, { status: 400 });
    }

    // Password is optional on update — blank means "keep the current one".
    const password = body.password?.trim();
    if (password && password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }

    const data = await UserService.update(id, {
      email,
      role,
      realtorId: realtorId ? new mongoose.Types.ObjectId(realtorId) : null,
      ...(password ? { password } : {}),
    });

    // See withoutPassword() — only matters when `password` was changed (that's the only case
    // where the update assigns the field onto this in-memory document), but always safe to apply.
    const safeData = data ? withoutPassword(data) : null;

    await LogEntryService.info({
      category: "Users",
      message: `User ${existing.email} was updated${password ? " (password changed)" : ""}`,
      userId: await getCurrentUserId(),
      realtorId,
      dataFrom: withoutPassword(existing),
      dataTo: safeData,
    });

    return NextResponse.json({ data: safeData, success: true });
  } catch (error) {
    console.error("PUT /api/users/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await UserService.get(id);
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await UserService.remove(id);

    await LogEntryService.info({
      category: "Users",
      message: `User ${existing.email} was deleted`,
      userId: await getCurrentUserId(),
      realtorId: existing.realtorId ? existing.realtorId.toString() : null,
      dataFrom: withoutPassword(existing),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/users/[id] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
