import { loadEnvConfig } from "@next/env";

// Seed scripts run standalone via `tsx`, not through the Next.js CLI, so `next dev`/`build`/`start`'s
// automatic .env loading never happens for them. Use Next's own loader (same one `next` uses
// internally) so these scripts see the same env vars (e.g. MONGODB_URI) as the running app.
loadEnvConfig(process.cwd());
