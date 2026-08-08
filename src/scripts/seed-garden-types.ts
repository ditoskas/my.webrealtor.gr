import "./env";
import { connectDB } from "@/lib/mongodb";
import { GardenType } from "@/models/GardenType";

const RECORDS = [
  { slug: "idiotikos-kipos", name: "Ιδιωτικός Κήπος" },
  { slug: "koinochristos-kipos", name: "Κοινόχρηστος κήπος" },
];

async function seedGardenType() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await GardenType.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Garden Type already exists: ${slug}`);
      continue;
    }

    await GardenType.create({ slug, name });
    console.log(`Garden Type created: ${slug} (${name})`);
  }
}

seedGardenType()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed garden types:", error);
    process.exit(1);
  });
