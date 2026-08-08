import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { IUser } from "@/models/User";
import type { JwtPayload, User } from "@/lib/types";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "1d";

// Single source of truth for the session cookie — read by the login/logout/me routes and by
// proxy.ts. Not readable from client JS (httpOnly): the browser sends it automatically on
// same-origin requests, but it can't be inspected/tampered with via document.cookie.
export const AUTH_COOKIE_NAME = "webrealtor_token";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day, matches the default JWT_EXPIRES_IN

export function toPublicUser(user: IUser): User {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    realtorId: user.realtorId ? user.realtorId.toString() : null,
    displayName: user.displayName ?? "",
    language: user.language,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function signAuthToken(user: IUser): string {
  const payload: JwtPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    realtorId: user.realtorId ? user.realtorId.toString() : null,
    tokenVersion: user.tokenVersion,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Identifies who's making the current request, purely for LogEntry attribution — every mutating
// route calls this so the audit trail records an actual user instead of a blank "—" (see CLAUDE.md
// → Logging). This is NOT an authorization check: it doesn't reject unauthenticated requests, it
// just returns null for them, the same optimistic-only posture proxy.ts already has (route-handler
// auth enforcement is still a separate TODO everywhere in this repo).
export async function getCurrentUserId(): Promise<string | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyAuthToken(token);
  return payload?.sub ?? null;
}
