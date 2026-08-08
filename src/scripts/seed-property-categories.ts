import "./env";
import { connectDB } from "@/lib/mongodb";
import { PropertyCategory } from "@/models/PropertyCategory";

const RECORDS = [
  { slug: "diamerisma", name: "Διαμέρισμα" },
  { slug: "studio-garsoniera", name: "Studio / Γκαρσονιέρα" },
  { slug: "mezoneta", name: "Μεζονέτα" },
  { slug: "monokatoikia", name: "Μονοκατοικία" },
  { slug: "vila", name: "Βίλα" },
  { slug: "loft", name: "Loft" },
  { slug: "bungalow", name: "Bungalow" },
  { slug: "ktirio", name: "Κτίριο" },
  { slug: "sygkrotima-diamerismaton", name: "Συγκρότημα διαμερισμάτων" },
  { slug: "farma-rantso", name: "Φάρμα / Ράντσο" },
  { slug: "ploto-spiti", name: "Πλωτό σπίτι" },
  { slug: "loipes-kategories", name: "Λοιπές κατηγορίες" },
];

async function seedPropertyCategory() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await PropertyCategory.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Property Category already exists: ${slug}`);
      continue;
    }

    await PropertyCategory.create({ slug, name });
    console.log(`Property Category created: ${slug} (${name})`);
  }
}

seedPropertyCategory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed property categories:", error);
    process.exit(1);
  });
