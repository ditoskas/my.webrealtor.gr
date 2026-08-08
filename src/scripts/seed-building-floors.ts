import "./env";
import { connectDB } from "@/lib/mongodb";
import { BuildingFloors } from "@/models/BuildingFloors";

const RECORDS = [
  { slug: "1", name: "1" },
  { slug: "2", name: "2" },
  { slug: "3", name: "3" },
  { slug: "4", name: "4" },
  { slug: "5", name: "5" },
  { slug: "6", name: "6" },
  { slug: "7", name: "7" },
  { slug: "8", name: "8" },
  { slug: "9", name: "9" },
  { slug: "10", name: "10" },
  { slug: "11", name: "11" },
  { slug: "12", name: "12" },
  { slug: "13", name: "13" },
  { slug: "14", name: "14" },
  { slug: "15", name: "15" },
  { slug: "16", name: "16" },
  { slug: "17", name: "17" },
  { slug: "18", name: "18" },
  { slug: "19", name: "19" },
  { slug: "20", name: "20" },
  { slug: "21", name: "21" },
  { slug: "22", name: "22" },
  { slug: "23", name: "23" },
  { slug: "24", name: "24" },
  { slug: "25", name: "25" },
  { slug: "26", name: "26" },
  { slug: "27", name: "27" },
  { slug: "28", name: "28" },
  { slug: "29", name: "29" },
  { slug: "30", name: "30" },
  { slug: "31", name: "31" },
  { slug: "32", name: "32" },
  { slug: "33", name: "33" },
  { slug: "34", name: "34" },
  { slug: "35", name: "35" },
  { slug: "36", name: "36" },
  { slug: "37", name: "37" },
  { slug: "38", name: "38" },
  { slug: "39", name: "39" },
  { slug: "40", name: "40" },
  { slug: "41", name: "41" },
  { slug: "42", name: "42" },
  { slug: "43", name: "43" },
  { slug: "44", name: "44" },
  { slug: "45", name: "45" },
  { slug: "46", name: "46" },
  { slug: "47", name: "47" },
  { slug: "48", name: "48" },
  { slug: "49", name: "49" },
  { slug: "50", name: "50" },
];

async function seedBuildingFloors() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await BuildingFloors.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Building Floors already exists: ${slug}`);
      continue;
    }

    await BuildingFloors.create({ slug, name });
    console.log(`Building Floors created: ${slug} (${name})`);
  }
}

seedBuildingFloors()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed building floors:", error);
    process.exit(1);
  });
