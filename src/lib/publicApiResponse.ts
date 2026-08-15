import { NextResponse } from "next/server";

// Every /api/public/** endpoint (see PUBLIC_API.md) returns this exact shape — success/payload/
// message — so third-party callers get one stable response contract across every public endpoint,
// present and future. Internal /api/** routes keep using ApiResponse<T> (lib/types.ts,
// data/message/success) unchanged; this is a deliberately separate, public-facing shape.
export class PublicApiResponse<T = unknown> {
  readonly success: boolean;
  readonly payload: T | null;
  readonly message: string;

  private constructor(success: boolean, payload: T | null, message: string) {
    this.success = success;
    this.payload = payload;
    this.message = message;
  }

  static success<T = unknown>(payload: T | null = null, message = ""): PublicApiResponse<T> {
    return new PublicApiResponse(true, payload, message);
  }

  static error(message: string): PublicApiResponse<null> {
    return new PublicApiResponse(false, null, message);
  }

  toResponse(status: number, headers?: HeadersInit): NextResponse {
    return NextResponse.json(this, { status, headers });
  }
}
