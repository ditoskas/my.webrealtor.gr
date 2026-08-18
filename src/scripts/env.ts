import { webcrypto } from "node:crypto";
import { loadEnvConfig } from "@next/env";

// The MongoDB driver (used transitively by mongoose) reads the Web Crypto API off
// `globalThis.crypto` directly, without importing it — that global only exists unflagged on
// Node.js 19+; on an older Node (e.g. some production hosts, vs. the Docker dev/prod images'
// Node 20) every script here would otherwise crash with "crypto is not defined" the moment a
// session/cursor gets cleaned up. Polyfilled here, before any script's own imports run, so every
// seed/migration script works regardless of the host's Node version.
if (!globalThis.crypto) {
  (globalThis as { crypto?: Crypto }).crypto = webcrypto as unknown as Crypto;
}

// Seed scripts run standalone via `tsx`, not through the Next.js CLI, so `next dev`/`build`/`start`'s
// automatic .env loading never happens for them. Use Next's own loader (same one `next` uses
// internally) so these scripts see the same env vars (e.g. MONGODB_URI) as the running app.
loadEnvConfig(process.cwd());
