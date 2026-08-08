import "./env";
import { connectDB } from "@/lib/mongodb";
import { JoineryType } from "@/models/JoineryType";

const RECORDS = [
  { slug: "ksylina", name: "Ξύλινα" },
  { slug: "alouminiou", name: "Αλουμινίου" },
  { slug: "synthetika", name: "Συνθετικά" },
  { slug: "ksylina-alouminiou", name: "Ξύλινα - Αλουμινίου" },
  { slug: "ksylina-synthetika", name: "Ξύλινα - Συνθετικά" },
  { slug: "alouminiou-synthetika", name: "Αλουμινίου - Συνθετικά" },
];

async function seedJoineryType() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await JoineryType.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Joinery Type already exists: ${slug}`);
      continue;
    }

    await JoineryType.create({ slug, name });
    console.log(`Joinery Type created: ${slug} (${name})`);
  }
}

seedJoineryType()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed joinery types:", error);
    process.exit(1);
  });
