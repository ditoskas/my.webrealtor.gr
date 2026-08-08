import { NextResponse } from "next/server";
import { OrientationService } from "@/services/OrientationService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

// TODO: gate with the Root-role check once route-level auth middleware lands.

export async function GET() {
  try {
    const data = await OrientationService.list();
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/orientations error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const slug = body.slug?.trim().toLowerCase();

    if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });
    if (!slug) return NextResponse.json({ message: "Slug is required" }, { status: 400 });

    const existing = await OrientationService.findBySlug(slug);
    if (existing) {
      return NextResponse.json({ message: "A orientation with this slug already exists" }, { status: 409 });
    }

    const data = await OrientationService.create({ name, slug });

    await LogEntryService.info({
      category: "Orientation",
      message: `Orientation "${data.name}" (${data.slug}) was created`,
      userId: await getCurrentUserId(),
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orientations error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
