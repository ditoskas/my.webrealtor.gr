import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { mimeForExtension, resolveUploadPath } from "@/lib/uploads";

// Serves files written by POST /api/uploads. Lives outside app/api so the URL is exactly
// UPLOADS_PUBLIC_URL ("/uploads/<file>"), not "/api/uploads/<file>" — Next's router treats any
// route.ts as routable regardless of nesting under api/, see CLAUDE.md's parsePropertyBody note
// for the same "route.ts is special, everything else isn't" rule applied in reverse here.
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  const filePath = resolveUploadPath(segments);
  if (!filePath) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const mime = mimeForExtension(path.extname(filePath).slice(1));
  if (!mime) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  try {
    const file = await readFile(filePath);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}
