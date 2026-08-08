import "./env";
import { connectDB } from "@/lib/mongodb";
import { HeatingMedium } from "@/models/HeatingMedium";

const RECORDS = [
  { slug: "petrelaio", name: "Πετρέλαιο" },
  { slug: "fysiko-aerio", name: "Φυσικό αέριο" },
  { slug: "ygraerio", name: "Υγραέριο" },
  { slug: "revma", name: "Ρεύμα" },
  { slug: "somba", name: "Σόμπα" },
  { slug: "thermosysoreftis", name: "Θερμοσυσσωρευτής" },
  { slug: "pellet", name: "Pellet" },
  { slug: "yperythres", name: "Υπέρυθρες" },
  { slug: "fan-coil", name: "Fan coil" },
  { slug: "ksyla", name: "Ξύλα" },
  { slug: "tilethermansi", name: "Τηλεθέρμανση" },
  { slug: "geothermiki-energeia", name: "Γεωθερμική Ενέργεια" },
  { slug: "antlia-thermansis", name: "Αντλία Θέρμανσης" },
];

async function seedHeatingMedium() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await HeatingMedium.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Heating Medium already exists: ${slug}`);
      continue;
    }

    await HeatingMedium.create({ slug, name });
    console.log(`Heating Medium created: ${slug} (${name})`);
  }
}

seedHeatingMedium()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed heating mediums:", error);
    process.exit(1);
  });
