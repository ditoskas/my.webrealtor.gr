import "./env";
import { connectDB } from "@/lib/mongodb";
import { Realtor } from "@/models/Realtor";
import { TagService } from "@/services/TagService";

// One-off backfill for the default "Recent" tag every realtor is now seeded with on creation
// (see RealtorService.create()/RegistrationService.completeRegistration(), CLAUDE.md → "Tags") —
// realtors that already existed before Tags shipped need this to get one. Idempotent (checked via
// TagService.findByRealtorIdAndName, same case-insensitive match used for the create-time
// duplicate check) — safe to run on every predev.
async function backfillRealtorTags() {
  await connectDB();

  const realtors = await Realtor.find({});
  let created = 0;

  for (const realtor of realtors) {
    const existing = await TagService.findByRealtorIdAndName(realtor.id, "Recent");
    if (existing) continue;
    await TagService.create({ realtorId: realtor._id, name: "Recent" });
    created += 1;
    console.log(`"Recent" tag backfilled for realtor: ${realtor.email}`);
  }

  if (created === 0) {
    console.log("All realtors already have a \"Recent\" tag");
  }
}

backfillRealtorTags()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to backfill realtor tags:", error);
    process.exit(1);
  });
