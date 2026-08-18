import "./env";
import { connectDB } from "@/lib/mongodb";

// One-off migration: copies every document out of the old `properties`/`lands` collections into
// the new merged `assets` collection (see models/Asset.ts), preserving each document's original
// `_id` — that's what keeps every existing Note/Attachment.entityId and Viewing/InterestFor/
// Transaction/PriceHistory.listingId reference resolving correctly with zero changes to those
// collections (see CLAUDE.md → "Asset management" for the full reasoning). Reads via the raw
// driver (mongoose.connection.db), not the old Property/Land Mongoose models, since those models
// are removed once this migration is in place — this script is the only remaining code that ever
// needs the old shape. Idempotent: skips any `_id` already present in `assets`, so it's safe to
// wire into predev/predev:docker and re-run on every dev boot. The old `properties`/`lands`
// collections are only ever read here, never written to or dropped — left in place as a manual
// rollback safety net.
async function migratePropertiesAndLandsToAssets() {
  const mongooseInstance = await connectDB();
  const db = mongooseInstance.connection.db;
  if (!db) throw new Error("No active database connection");

  const assets = db.collection("assets");
  const existingIds = new Set((await assets.find({}, { projection: { _id: 1 } }).toArray()).map((doc) => String(doc._id)));

  let migratedProperties = 0;
  let migratedLands = 0;

  const properties = await db.collection("properties").find({}).toArray();
  for (const property of properties) {
    if (existingIds.has(String(property._id))) continue;
    await assets.insertOne({ ...property, isLand: false });
    migratedProperties += 1;
  }

  const lands = await db.collection("lands").find({}).toArray();
  for (const land of lands) {
    if (existingIds.has(String(land._id))) continue;
    await assets.insertOne({ ...land, isLand: true });
    migratedLands += 1;
  }

  const totalAssets = await assets.countDocuments();
  console.log(
    `Migrated ${migratedProperties} propert${migratedProperties === 1 ? "y" : "ies"} + ${migratedLands} land${migratedLands === 1 ? "" : "s"} into assets ` +
      `(properties: ${properties.length}, lands: ${lands.length}, assets total now: ${totalAssets})`
  );
}

migratePropertiesAndLandsToAssets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to migrate properties/lands to assets:", error);
    process.exit(1);
  });
