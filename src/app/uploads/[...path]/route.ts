import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { mimeForExtension, resolveUploadPath } from "@/lib/uploads";

// Serves files written by POST /api/uploads. Lives outside app/api so the URL is exactly
// UPLOADS_PUBLIC_URL ("/uploads/<file>"), not "/api/uploads/<file>" — Next's router treats any
// route.ts as routable regardless of nesting under api/, see CLAUDE.md's parsePropertyBody note
// for the same "route.ts is special, everything else isn't" rule applied in reverse here.
//
// CORS_HEADERS matters here specifically because of Chrome's Opaque Response Blocking (ORB,
// CORB's successor): a cross-origin <img>/<video> load without a Cross-Origin-Resource-Policy
// header gets ORB-blocked outright the moment the response isn't unambiguously image/media
// content — which every error branch below is (JSON). Realtor sites (e.g.
// realestate-toskas.gr embedding a property photo by URL) hit exactly this on a miss/error, not
// just on success, so every response here — not only the 200 — needs it.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cross-Origin-Resource-Policy": "cross-origin",
};

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  const filePath = resolveUploadPath(segments);
  if (!filePath) {
    return NextResponse.json({ message: "Not found" }, { status: 404, headers: CORS_HEADERS });
  }

  const mime = mimeForExtension(path.extname(filePath).slice(1));
  if (!mime) {
    return NextResponse.json({ message: "Not found" }, { status: 404, headers: CORS_HEADERS });
  }

  try {
    const file = await readFile(filePath);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        ...CORS_HEADERS,
      },
    });
  } catch {
    return NextResponse.json({ message: "Not found" }, { status: 404, headers: CORS_HEADERS });
  }
}
