import "./env";
import { connectDB } from "@/lib/mongodb";
import { HeatingSystem } from "@/models/HeatingSystem";

const HEATING_SYSTEMS = [
  { slug: "autonomi", name: "Αυτόνομη" },
  { slug: "kentriki", name: "Κεντρική" },
  { slug: "atomiki", name: "Ατομική Θέρμανση" },
  { slug: "none", name: "Χωρίς θέρμανση" },
];

async function seedHeatingSystems() {
  await connectDB();

  for (const { slug, name } of HEATING_SYSTEMS) {
    const existing = await HeatingSystem.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Heating system already exists: ${slug}`);
      continue;
    }

    await HeatingSystem.create({ slug, name });
    console.log(`Heating system created: ${slug} (${name})`);
  }
}

seedHeatingSystems()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed heating systems:", error);
    process.exit(1);
  });
