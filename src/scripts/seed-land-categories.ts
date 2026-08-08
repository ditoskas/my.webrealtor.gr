import "./env";
import { connectDB } from "@/lib/mongodb";
import { LandCategory } from "@/models/LandCategory";

const RECORDS = [
  { slug: "oikopedo", name: "Οικόπεδο" },
  { slug: "agrotemachio", name: "Αγροτεμάχιο" },
  { slug: "nisi", name: "Νησί" },
  { slug: "loipes-katigories", name: "Λοιπές κατηγορίες" },
];

async function seedLandCategory() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await LandCategory.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Land Category already exists: ${slug}`);
      continue;
    }

    await LandCategory.create({ slug, name });
    console.log(`Land Category created: ${slug} (${name})`);
  }
}

seedLandCategory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed land categories:", error);
    process.exit(1);
  });
