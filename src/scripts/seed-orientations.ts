import "./env";
import { connectDB } from "@/lib/mongodb";
import { Orientation } from "@/models/Orientation";

const RECORDS = [
  { slug: "anatolikos", name: "Ανατολικός" },
  { slug: "anatolikodytikos", name: "Ανατολικοδυτικός" },
  { slug: "anatolikomesimvrinos", name: "Ανατολικομεσημβρινός" },
  { slug: "voreios", name: "Βόρειος" },
  { slug: "voreioanatolikos", name: "Βορειοανατολικός" },
  { slug: "voreiodytikos", name: "Βορειοδυτικός" },
  { slug: "dytikos", name: "Δυτικός" },
  { slug: "dytikomesimvrinos", name: "Δυτικομεσημβρινός" },
  { slug: "mesimvrinos", name: "Μεσημβρινός" },
  { slug: "notios", name: "Νότιος" },
  { slug: "notioanatolikos", name: "Νοτιοανατολικός" },
  { slug: "notiodytikos", name: "Νοτιοδυτικός" },
];

async function seedOrientation() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await Orientation.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Orientation already exists: ${slug}`);
      continue;
    }

    await Orientation.create({ slug, name });
    console.log(`Orientation created: ${slug} (${name})`);
  }
}

seedOrientation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed orientations:", error);
    process.exit(1);
  });
