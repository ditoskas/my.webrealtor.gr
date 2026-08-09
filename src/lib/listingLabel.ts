import type {
  FloorLevel,
  InterestForListingType,
  Land,
  LandCategory,
  Property,
  PropertyCategory,
  Transaction,
} from "./types";

// Category/Floor/Address — the same "enough context to tell listings apart" info shown for a
// listing elsewhere (PropertyTable/PropertyViewPage), not just the raw title. Shared by every
// picker that needs to label an actual Property/Land record (ViewingForm/ViewingTable,
// TransactionForm/TransactionTable, ReceiptPage's transaction picker) — extracted here once a
// second consumer needed it, per CLAUDE.md's "reuse over copy-paste" convention.
//
// Exposed as parts (not just the joined string) so a caller that needs a different separator or
// extra leading/trailing segments — e.g. ReceiptPage prefixing a transaction id + Sale/Rent —
// doesn't have to duplicate the category/floor/address lookup logic itself.
export function listingLabelParts(
  listing: Property | Land,
  kind: InterestForListingType,
  propertyCategories: PropertyCategory[],
  floorLevels: FloorLevel[],
  landCategories: LandCategory[]
): string[] {
  const parts: string[] = [];
  if (kind === "Property") {
    const property = listing as Property;
    const category = propertyCategories.find((c) => c.id === property.propertyCategoryId)?.name;
    if (category) parts.push(category);
    const floor = floorLevels.find((f) => f.id === property.floorLevelId)?.name;
    if (floor) parts.push(floor);
  } else {
    const land = listing as Land;
    const category = landCategories.find((c) => c.id === land.landCategoryId)?.name;
    if (category) parts.push(category);
  }
  const address = [listing.address, listing.city].filter(Boolean).join(", ");
  if (address) parts.push(address);
  return parts;
}

export function listingLabel(
  listing: Property | Land,
  kind: InterestForListingType,
  propertyCategories: PropertyCategory[],
  floorLevels: FloorLevel[],
  landCategories: LandCategory[]
): string {
  const parts = listingLabelParts(listing, kind, propertyCategories, floorLevels, landCategories);
  return parts.length > 0 ? parts.join(" · ") : listing.title || listing.id;
}

// "<id> - <Sale|Rent> - <category> - <floor> - <address>" — the transaction-picker label shared by
// ReceiptPage and ContractPage's "Save as PDF" tools (both let a user pick a transaction to
// generate a document for). tx.id is shortened to match the same "...{last 8 chars}" convention
// TransactionTable's ID column already uses. `t` takes a translate function so the Sale/Rent word
// stays localized without this shared module depending on useTranslation() itself.
export function transactionOptionLabel(
  tx: Transaction,
  propertyListings: Property[],
  landListings: Land[],
  propertyCategories: PropertyCategory[],
  floorLevels: FloorLevel[],
  landCategories: LandCategory[],
  t: (key: string) => string
): string {
  const listing =
    tx.listingType === "Property"
      ? propertyListings.find((p) => p.id === tx.listingId)
      : landListings.find((l) => l.id === tx.listingId);

  const parts = [tx.id.slice(-8)];
  if (listing?.transactionType) {
    parts.push(t(`receipt.transactionType.${listing.transactionType}`));
  }
  if (listing) {
    parts.push(...listingLabelParts(listing, tx.listingType, propertyCategories, floorLevels, landCategories));
  }
  return parts.join(" - ");
}
