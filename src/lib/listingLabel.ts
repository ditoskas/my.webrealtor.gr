import type {
  FloorLevel,
  InterestForListingType,
  Land,
  LandCategory,
  Property,
  PropertyCategory,
} from "./types";

// Category/Floor/Address — the same "enough context to tell listings apart" info shown for a
// listing elsewhere (PropertyTable/PropertyViewPage), not just the raw title. Shared by every
// picker that needs to label an actual Property/Land record (ViewingForm/ViewingTable,
// TransactionForm/TransactionTable) — extracted here once a second consumer needed it, per
// CLAUDE.md's "reuse over copy-paste" convention.
export function listingLabel(
  listing: Property | Land,
  kind: InterestForListingType,
  propertyCategories: PropertyCategory[],
  floorLevels: FloorLevel[],
  landCategories: LandCategory[]
): string {
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
  return parts.length > 0 ? parts.join(" · ") : listing.title || listing.id;
}
