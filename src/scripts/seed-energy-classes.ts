import "./env";
import { connectDB } from "@/lib/mongodb";
import { EnergyClass } from "@/models/EnergyClass";

// Greek residential energy performance certificate scale, best to worst — seeded in this order
// so EnergyClassRepository.findActive()'s ascending-createdAt sort lists them best-first.
const ENERGY_CLASS_NAMES = ["Α+", "Α", "Β+", "Β", "Γ", "Δ", "Ε", "Ζ", "Η"];

async function seedEnergyClasses() {
  await connectDB();

  for (const name of ENERGY_CLASS_NAMES) {
    const existing = await EnergyClass.findOne({ name, deletedAt: null });
    if (existing) {
      console.log(`Energy class already exists: ${name}`);
      continue;
    }

    await EnergyClass.create({ name });
    console.log(`Energy class created: ${name}`);
  }
}

seedEnergyClasses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed energy classes:", error);
    process.exit(1);
  });
