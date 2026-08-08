import { NextResponse } from "next/server";
import { LandCategoryService } from "@/services/LandCategoryService";
import { LogEntryService } from "@/services/LogEntryService";
import { getCurrentUserId } from "@/lib/auth";

// TODO: gate with the Root-role check once route-level auth middleware lands.

export async function GET() {
  try {
    const data = await LandCategoryService.list();
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("GET /api/land-categories error", error);
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

    const existing = await LandCategoryService.findBySlug(slug);
    if (existing) {
      return NextResponse.json({ message: "A land category with this slug already exists" }, { status: 409 });
    }

    const data = await LandCategoryService.create({ name, slug });

    await LogEntryService.info({
      category: "LandCategory",
      message: `Land category "${data.name}" (${data.slug}) was created`,
      userId: await getCurrentUserId(),
      dataTo: data.toJSON() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/land-categories error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
