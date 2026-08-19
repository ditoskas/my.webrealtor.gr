"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCanEdit, useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Asset, Client, LandCategory, PropertyCategory, Realtor, Tag } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import AssetTable from "./AssetTable";
import AssetSearchBar from "./AssetSearchBar";
import DeleteAssetModal from "./DeleteAssetModal";

// Merges the old PropertiesPage + LandsPage into one — see CLAUDE.md → "Asset management". Single
// list, single /api/assets fetch, a Type/Kind filter replacing the two separate nav destinations.
export default function AssetsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();
  const user = useCurrentUser();
  const canEdit = useCanEdit();
  const isRoot = user?.role === "Root";

  const [assets, setAssets] = useState<Asset[]>([]);
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const [landCategories, setLandCategories] = useState<LandCategory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const [kindFilter, setKindFilter] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchText, setSearchText] = useState("");
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  // Same silent-reload / page-load count message convention as every other list page — see
  // CLAUDE.md → Footer notifications. Root fetches every realtor's listings plus the realtor list
  // (to resolve a Realtor column) and every client (to resolve the Owner column); Administrator/
  // Operator only fetch their own realtor's listings and their own realtor's clients. Tags are
  // always realtor-scoped (see CLAUDE.md → "Tags") — Root has no realtorId of its own to fetch a
  // tag set by, so the tag filter simply doesn't render for Root (AssetSearchBar hides it when
  // `tags` is empty).
  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) return;
      try {
        const assetsUrl = isRoot ? "/api/assets" : `/api/assets?realtorId=${user.realtorId}`;
        const clientsUrl = isRoot ? "/api/clients" : `/api/clients?realtorId=${user.realtorId}`;
        const [assetsRes, realtorsRes, propertyCategoriesRes, landCategoriesRes, clientsRes, tagsRes] = await Promise.all([
          apiClient.get<ApiResponse<Asset[]>>(assetsUrl),
          isRoot ? apiClient.get<ApiResponse<Realtor[]>>("/api/realtors") : Promise.resolve(null),
          apiClient.get<ApiResponse<PropertyCategory[]>>("/api/property-categories"),
          apiClient.get<ApiResponse<LandCategory[]>>("/api/land-categories"),
          apiClient.get<ApiResponse<Client[]>>(clientsUrl),
          isRoot ? Promise.resolve(null) : apiClient.get<ApiResponse<Tag[]>>(`/api/tags?realtorId=${user.realtorId}`),
        ]);
        setAssets(assetsRes.data.data);
        if (realtorsRes) setRealtors(realtorsRes.data.data);
        setPropertyCategories(propertyCategoriesRes.data.data);
        setLandCategories(landCategoriesRes.data.data);
        setClients(clientsRes.data.data);
        setTags(tagsRes ? tagsRes.data.data : []);

        // Tag id -> name lookup for the list table's Tags column (see CLAUDE.md → "Tags"). For
        // non-Root this is just the already-fetched `tags` above. Root has no realtorId of its own
        // (that fetch is skipped, see below), so instead resolve every realtor actually present in
        // this load's asset list, one /api/tags?realtorId= call each — a tag id alone doesn't say
        // which realtor's tag set it came from.
        if (isRoot) {
          const realtorIds = Array.from(new Set(assetsRes.data.data.map((asset) => asset.realtorId)));
          const tagLists = await Promise.all(
            realtorIds.map((id) =>
              apiClient
                .get<ApiResponse<Tag[]>>(`/api/tags?realtorId=${id}`)
                .then((response) => response.data.data)
                .catch(() => [])
            )
          );
          setTagNames(
            tagLists.flat().reduce<Record<string, string>>((map, tag) => {
              map[tag.id] = tag.name;
              return map;
            }, {})
          );
        } else {
          setTagNames(
            (tagsRes ? tagsRes.data.data : []).reduce<Record<string, string>>((map, tag) => {
              map[tag.id] = tag.name;
              return map;
            }, {})
          );
        }

        setError(null);
        if (!options?.silent) {
          MessageHandler.normal(dispatch, t("assets.countMessage", { count: assetsRes.data.data.length }));
        }
      } catch {
        setError(t("assets.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, isRoot, user, t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadData();
  }, [loadData]);

  const reloadSilently = useCallback(() => loadData({ silent: true }), [loadData]);

  // Publish/unpublish row action — see CLAUDE.md → "Public listings API". POST stamps `publishedAt`
  // with now, DELETE clears it; same convention as /api/realtors/[id]/image.
  const handleTogglePublish = useCallback(
    async (asset: Asset) => {
      const title = asset.title || t("assets.table.listingFallback", { id: asset.id });
      try {
        if (asset.publishedAt) {
          await apiClient.delete(`/api/assets/${asset.id}/publish`);
          MessageHandler.success(dispatch, t("assets.table.unpublishSuccess", { title }));
        } else {
          await apiClient.post(`/api/assets/${asset.id}/publish`);
          MessageHandler.success(dispatch, t("assets.table.publishSuccess", { title }));
        }
        reloadSilently();
      } catch {
        MessageHandler.error(dispatch, t("assets.table.publishError"));
      }
    },
    [dispatch, reloadSilently, t]
  );

  const realtorNames = useMemo(
    () =>
      realtors.reduce<Record<string, string>>((map, realtor) => {
        map[realtor.id] = `${realtor.firstName} ${realtor.lastName}`;
        return map;
      }, {}),
    [realtors]
  );

  const propertyCategoryNames = useMemo(
    () =>
      propertyCategories.reduce<Record<string, string>>((map, category) => {
        map[category.id] = category.name;
        return map;
      }, {}),
    [propertyCategories]
  );

  const landCategoryNames = useMemo(
    () =>
      landCategories.reduce<Record<string, string>>((map, category) => {
        map[category.id] = category.name;
        return map;
      }, {}),
    [landCategories]
  );

  const owners = useMemo(
    () =>
      clients.reduce<Record<string, { name: string; phone: string }>>((map, client) => {
        map[client.id] = { name: `${client.firstName} ${client.lastName}`, phone: client.phone || client.mobile || "" };
        return map;
      }, {}),
    [clients]
  );

  // Client-side filtering — the full scoped list is already loaded, so there's no pagination to
  // fight with. Same "search matches owner + location, not title" convention as the old
  // PropertiesPage — see CLAUDE.md → "Property management".
  const filteredAssets = useMemo(() => {
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;
    const search = searchText.trim().toLowerCase();

    return assets.filter((asset) => {
      if (kindFilter === "property" && asset.isLand) return false;
      if (kindFilter === "land" && !asset.isLand) return false;
      if (transactionTypeFilter && asset.transactionType !== transactionTypeFilter) return false;
      if (statusFilter && asset.status !== statusFilter) return false;
      if (categoryFilter) {
        const categoryId = asset.isLand ? asset.landCategoryId : asset.propertyCategoryId;
        if (categoryId !== categoryFilter) return false;
      }
      if (min !== null && !Number.isNaN(min) && asset.price < min) return false;
      if (max !== null && !Number.isNaN(max) && asset.price > max) return false;
      if (tagFilter.length > 0 && !asset.tagIds.some((tagId) => tagFilter.includes(tagId))) return false;

      if (search) {
        const ownerName = asset.clientId ? owners[asset.clientId]?.name ?? "" : "";
        const haystack = [ownerName, asset.city, asset.region, asset.address, asset.neighborhood]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });
  }, [assets, kindFilter, transactionTypeFilter, statusFilter, categoryFilter, minPrice, maxPrice, tagFilter, searchText, owners]);

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{t("assets.pageTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("assets.pageSubtitle")}</p>
        </div>
        {canEdit && <Button onClick={() => router.push("/assets/new")}>{t("assets.newListing")}</Button>}
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("assets.loading")}</p>
      ) : (
        <>
          <AssetSearchBar
            kindFilter={kindFilter}
            onKindFilterChange={setKindFilter}
            transactionTypeFilter={transactionTypeFilter}
            onTransactionTypeFilterChange={setTransactionTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            propertyCategories={propertyCategories}
            landCategories={landCategories}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            minPrice={minPrice}
            onMinPriceChange={setMinPrice}
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
            searchText={searchText}
            onSearchTextChange={setSearchText}
            tags={tags}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
          />
          <AssetTable
            assets={filteredAssets}
            realtorNames={realtorNames}
            propertyCategoryNames={propertyCategoryNames}
            landCategoryNames={landCategoryNames}
            owners={owners}
            tagNames={tagNames}
            showRealtorColumn={isRoot}
            canEdit={canEdit}
            onView={(asset) => router.push(`/assets/${asset.id}/view`)}
            onEdit={(asset) => router.push(`/assets/${asset.id}`)}
            onDelete={setAssetToDelete}
            onMedia={(asset) => router.push(`/assets/${asset.id}/media`)}
            onReceipt={(asset) => router.push(`/tools/receipt?propertyId=${asset.id}`)}
            onTogglePublish={handleTogglePublish}
          />
        </>
      )}

      <DeleteAssetModal
        isOpen={!!assetToDelete}
        asset={assetToDelete}
        onClose={() => setAssetToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
