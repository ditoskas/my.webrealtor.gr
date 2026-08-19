import "./env";
import fs from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import { Asset } from "@/models/Asset";
import { UPLOADS_DIR, UPLOADS_PUBLIC_URL } from "@/lib/uploads";

// One-off migration: moves each Asset's already-uploaded gallery images from the old flat
// `<UPLOADS_DIR>/realtors/<realtorId>/<assetId>/` layout to the new
// `<UPLOADS_DIR>/realtors/<realtorId>/assets/<assetId>/` layout (see lib/uploads.ts's
// listingUploadDir/listingUploadUrlPrefix) — the nested `assets/` segment was added so a listing's
// gallery folder can never collide with that same realtor's own `profile` photo folder. Moves the
// files on disk (if the old folder still exists) and rewrites every affected Asset.images[].url to
// match. Idempotent: an asset whose old-shape folder is already gone and whose URLs already carry
// the new shape is a no-op, so this is safe to wire into predev/predev:docker and re-run forever.
async function migrateAssetImagesToNestedFolder() {
  await connectDB();

  const assets = await Asset.find({ "images.0": { $exists: true } });
  let movedFolders = 0;
  let rewrittenAssets = 0;

  for (const asset of assets) {
    const realtorId = asset.realtorId.toString();
    const assetId = asset.id;
    const oldDir = path.join(UPLOADS_DIR, "realtors", realtorId, assetId);
    const newDir = path.join(UPLOADS_DIR, "realtors", realtorId, "assets", assetId);

    const oldDirExists = await fs
      .access(oldDir)
      .then(() => true)
      .catch(() => false);
    if (oldDirExists) {
      await fs.mkdir(path.dirname(newDir), { recursive: true });
      await fs.rename(oldDir, newDir);
      movedFolders += 1;
    }

    const oldUrlPrefix = `${UPLOADS_PUBLIC_URL}/realtors/${realtorId}/${assetId}/`;
    const newUrlPrefix = `${UPLOADS_PUBLIC_URL}/realtors/${realtorId}/assets/${assetId}/`;
    let changed = false;
    for (const image of asset.images) {
      if (image.url.startsWith(oldUrlPrefix)) {
        image.url = newUrlPrefix + image.url.slice(oldUrlPrefix.length);
        changed = true;
      }
    }
    if (changed) {
      await asset.save();
      rewrittenAssets += 1;
    }
  }

  console.log(`Moved ${movedFolders} asset image folder(s), rewrote images on ${rewrittenAssets} asset(s)`);
}

migrateAssetImagesToNestedFolder()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to migrate asset image folders:", error);
    process.exit(1);
  });
