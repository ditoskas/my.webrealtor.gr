import "./env";
import { connectDB } from "@/lib/mongodb";
import { RoadAccessType } from "@/models/RoadAccessType";

const RECORDS = [
  { slug: "asfalto", name: "Άσφαλτο" },
  { slug: "pezodromo", name: "Πεζόδρομο" },
  { slug: "plakostroto", name: "Πλακόστρωτο" },
  { slug: "chomatodromo", name: "Χωματόδρομο" },
  { slug: "den-yparchei-prosvasi", name: "Δεν υπάρχει πρόσβαση" },
  { slug: "thalassa", name: "Θάλασσα" },
  { slug: "allou", name: "Αλλού" },
];

async function seedRoadAccessType() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await RoadAccessType.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Road Access Type already exists: ${slug}`);
      continue;
    }

    await RoadAccessType.create({ slug, name });
    console.log(`Road Access Type created: ${slug} (${name})`);
  }
}

seedRoadAccessType()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed road access types:", error);
    process.exit(1);
  });
