// Shared by GET /api/public/assets (list) and GET /api/public/assets/[id] (detail) — see
// PUBLIC_API.md. Strips internal-only refs (clientId links to a Client, realtorId is implied by
// guid, tagIds are the realtor's own organizational labels — a caller can already filter by tag
// name via `?tag=`, so the raw ids are meaningless without a tag-lookup endpoint this API doesn't
// expose) and flattens whichever populated category ref applies (propertyCategoryId for a
// property, landCategoryId for a land asset — see AssetRepository's two .populate() calls) into a
// single `propertyCategory`/`landCategory` object, the other one omitted entirely rather than
// sent as null, since it's never meaningful for that item's `isLand`.
export function serializePublicAsset(asset: { isLand: boolean; toJSON: () => Record<string, unknown> }) {
  const {
    clientId: _clientId,
    realtorId: _realtorId,
    tagIds: _tagIds,
    propertyCategoryId,
    landCategoryId,
    ...rest
  } = asset.toJSON();
  return asset.isLand
    ? { ...rest, isLand: true, landCategory: landCategoryId ?? null }
    : { ...rest, isLand: false, propertyCategory: propertyCategoryId ?? null };
}
