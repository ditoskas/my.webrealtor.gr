import "./env";
import { connectDB } from "@/lib/mongodb";
import { Slope } from "@/models/Slope";

const RECORDS = [
  { slug: "epipedo", name: "Επίπεδο" },
  { slug: "epiklines", name: "Επικλινές" },
  { slug: "amfitheatriko", name: "Αμφιθεατρικό" },
];

async function seedSlope() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await Slope.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Slope already exists: ${slug}`);
      continue;
    }

    await Slope.create({ slug, name });
    console.log(`Slope created: ${slug} (${name})`);
  }
}

seedSlope()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed slopes:", error);
    process.exit(1);
  });
