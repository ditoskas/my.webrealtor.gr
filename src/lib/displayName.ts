import type { User } from "./types";

// Single source of truth for "what name do we show for this user" — the Topbar and the
// post-login welcome message both fall back to the email whenever displayName is unset
// (see CLAUDE.md → Profile).
export function getDisplayName(user: Pick<User, "displayName" | "email">): string {
  return user.displayName.trim() || user.email;
}
