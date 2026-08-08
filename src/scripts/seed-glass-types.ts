import "./env";
import { connectDB } from "@/lib/mongodb";
import { GlassType } from "@/models/GlassType";

const RECORDS = [
  { slug: "monos-yalopinakas", name: "Μονός υαλοπίνακας" },
  { slug: "diplos-yalopinakas", name: "Διπλός υαλοπίνακας" },
  { slug: "triplos-yalopinakas", name: "Τριπλός υαλοπίνακας" },
];

async function seedGlassType() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await GlassType.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Glass Type already exists: ${slug}`);
      continue;
    }

    await GlassType.create({ slug, name });
    console.log(`Glass Type created: ${slug} (${name})`);
  }
}

seedGlassType()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed glass types:", error);
    process.exit(1);
  });
