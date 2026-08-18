import type { Asset, FloorLevel, LandCategory, PropertyCategory, Transaction } from "./types";

// Category/Floor/Address — the same "enough context to tell listings apart" info shown for a
// listing elsewhere (AssetTable/AssetViewPage), not just the raw title. Shared by every picker
// that needs to label an actual Asset record (ViewingForm/ViewingTable, TransactionForm/
// TransactionTable, ReceiptPage's transaction picker) — extracted here once a second consumer
// needed it, per CLAUDE.md's "reuse over copy-paste" convention. Branches on `asset.isLand`
// instead of a separate Property-or-Land discriminator now that both are one Asset shape (see
// CLAUDE.md → "Asset management").
//
// Exposed as parts (not just the joined string) so a caller that needs a different separator or
// extra leading/trailing segments — e.g. ReceiptPage prefixing a transaction id + Sale/Rent —
// doesn't have to duplicate the category/floor/address lookup logic itself.
export function listingLabelParts(
  asset: Asset,
  propertyCategories: PropertyCategory[],
  floorLevels: FloorLevel[],
  landCategories: LandCategory[]
): string[] {
  const parts: string[] = [];
  if (!asset.isLand) {
    const category = propertyCategories.find((c) => c.id === asset.propertyCategoryId)?.name;
    if (category) parts.push(category);
    const floor = floorLevels.find((f) => f.id === asset.floorLevelId)?.name;
    if (floor) parts.push(floor);
  } else {
    const category = landCategories.find((c) => c.id === asset.landCategoryId)?.name;
    if (category) parts.push(category);
  }
  const address = [asset.address, asset.city].filter(Boolean).join(", ");
  if (address) parts.push(address);
  return parts;
}

export function listingLabel(
  asset: Asset,
  propertyCategories: PropertyCategory[],
  floorLevels: FloorLevel[],
  landCategories: LandCategory[]
): string {
  const parts = listingLabelParts(asset, propertyCategories, floorLevels, landCategories);
  return parts.length > 0 ? parts.join(" · ") : asset.title || asset.id;
}

// "<id> - <Sale|Rent> - <category> - <floor> - <address>" — the transaction-picker label shared by
// ReceiptPage and ContractPage's "Save as PDF" tools (both let a user pick a transaction to
// generate a document for). tx.id is shortened to match the same "...{last 8 chars}" convention
// TransactionTable's ID column already uses. `t` takes a translate function so the Sale/Rent word
// stays localized without this shared module depending on useTranslation() itself.
export function transactionOptionLabel(
  tx: Transaction,
  listings: Asset[],
  propertyCategories: PropertyCategory[],
  floorLevels: FloorLevel[],
  landCategories: LandCategory[],
  t: (key: string) => string
): string {
  const listing = listings.find((asset) => asset.id === tx.listingId);

  const parts = [tx.id.slice(-8)];
  if (listing?.transactionType) {
    parts.push(t(`receipt.transactionType.${listing.transactionType}`));
  }
  if (listing) {
    parts.push(...listingLabelParts(listing, propertyCategories, floorLevels, landCategories));
  }
  return parts.join(" - ");
}
