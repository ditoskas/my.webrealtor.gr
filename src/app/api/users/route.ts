import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { UserService } from "@/services/UserService";
import { RealtorService } from "@/services/RealtorService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";
import { USER_ROLES } from "@/lib/types";

// TODO: gate with the Root-role check once route-level auth middleware lands.

export async function GET() {
  try {
    const data = await UserService.list();
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/users error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const role = USER_ROLES.includes(body.role) ? body.role : null;

    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });
    if (!password || password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!role) return NextResponse.json({ message: "A valid role is required" }, { status: 400 });

    // Root is platform-wide and never belongs to a realtor; every other role must.
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

    const existing = await UserService.findByEmail(email);
    if (existing) {
      return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
    }

    const data = await UserService.create({
      email,
      password,
      role,
      realtorId: realtorId ? new mongoose.Types.ObjectId(realtorId) : null,
    });

    // `select: false` only affects default query projection — it does NOT hide a field that
    // was just explicitly assigned on this in-memory document (as `password` always is right
    // after `.create()`), so `data.toJSON()` here still contains the hash. Strip it before it
    // reaches the log OR the HTTP response.
    const { password: _pw, ...safeData } = data.toJSON() as unknown as Record<string, unknown>;
    void _pw;
    await LogEntryService.info({
      category: "Users",
      message: `User ${data.email} (${data.role}) was created`,
      userId: await getCurrentUserId(),
      realtorId,
      dataTo: safeData,
    });

    return NextResponse.json({ data: safeData, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
