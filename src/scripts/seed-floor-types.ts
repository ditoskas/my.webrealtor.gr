import "./env";
import { connectDB } from "@/lib/mongodb";
import { FloorType } from "@/models/FloorType";

const RECORDS = [
  { slug: "marmaro", name: "Μάρμαρο" },
  { slug: "ksylo", name: "Ξύλο" },
  { slug: "petra", name: "Πέτρα" },
  { slug: "plakaki", name: "Πλακάκι" },
  { slug: "mosaiko", name: "Μωσαϊκό" },
  { slug: "marmaro-ksylo", name: "Μάρμαρο-Ξύλο" },
  { slug: "marmaro-plakaki", name: "Μάρμαρο-Πλακάκι" },
  { slug: "petra-ksylo", name: "Πέτρα-Ξύλο" },
  { slug: "petra-marmaro", name: "Πέτρα-Μάρμαρο" },
  { slug: "plakaki-ksylo", name: "Πλακάκι-Ξύλο" },
  { slug: "mosaiko-ksylo", name: "Μωσαϊκό-Ξύλο" },
  { slug: "viomichaniko-dapedo", name: "Βιομηχανικό δάπεδο" },
  { slug: "laminate-dapeda", name: "Laminate δάπεδα" },
  { slug: "dapedo-vinyliou", name: "Δάπεδο βινυλίου" },
];

async function seedFloorType() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await FloorType.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Floor Type already exists: ${slug}`);
      continue;
    }

    await FloorType.create({ slug, name });
    console.log(`Floor Type created: ${slug} (${name})`);
  }
}

seedFloorType()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed floor types:", error);
    process.exit(1);
  });
