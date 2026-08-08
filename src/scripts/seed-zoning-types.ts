import "./env";
import { connectDB } from "@/lib/mongodb";
import { ZoningType } from "@/models/ZoningType";

const RECORDS = [
  { slug: "oikistiki-zoni", name: "Οικιστική ζώνη" },
  { slug: "agrotiki-zoni", name: "Αγροτική ζώνη" },
  { slug: "emporiki-zoni", name: "Εμπορική ζώνη" },
  { slug: "viomichaniki-zoni", name: "Βιομηχανική ζώνη" },
  { slug: "zoni-anaplasis", name: "Ζώνη Ανάπλασης" },
  { slug: "ektos-schediou", name: "Εκτός Σχεδίου" },
];

async function seedZoningType() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await ZoningType.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Zoning Type already exists: ${slug}`);
      continue;
    }

    await ZoningType.create({ slug, name });
    console.log(`Zoning Type created: ${slug} (${name})`);
  }
}

seedZoningType()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed zoning types:", error);
    process.exit(1);
  });
