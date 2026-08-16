import "./env";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/mongodb";
import { Realtor } from "@/models/Realtor";

// One-off backfill for Realtor.guid — the schema's `default: () => randomUUID()` (see
// models/Realtor.ts) only fires for documents created from here on; realtors that already existed
// when the field was added need this to get one. Idempotent: safe to run on every predev, only
// touches realtors still missing a guid.
async function backfillRealtorGuids() {
  await connectDB();

  const realtors = await Realtor.find({ guid: { $exists: false } });
  if (realtors.length === 0) {
    console.log("All realtors already have a guid");
    return;
  }

  for (const realtor of realtors) {
    realtor.guid = randomUUID();
    await realtor.save();
    console.log(`Realtor guid backfilled: ${realtor.email}`);
  }
}

backfillRealtorGuids()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to backfill realtor guids:", error);
    process.exit(1);
  });
