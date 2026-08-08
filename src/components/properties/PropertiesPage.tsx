"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCanEdit, useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Client, Property, PropertyCategory, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import PropertyTable from "./PropertyTable";
import PropertySearchBar from "./PropertySearchBar";
import DeletePropertyModal from "./DeletePropertyModal";

export default function PropertiesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();
  const user = useCurrentUser();
  const canEdit = useCanEdit();
  const isRoot = user?.role === "Root";

  const [properties, setProperties] = useState<Property[]>([]);
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchText, setSearchText] = useState("");

  // Same silent-reload / page-load count message convention as ClientsPage — see CLAUDE.md →
  // Footer notifications. Root fetches every realtor's listings plus the realtor list (to resolve
  // a Realtor column) and every client (to resolve the Owner column); Administrator/Operator only
  // fetch their own realtor's listings and their own realtor's clients.
  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) return;
      try {
        const propertiesUrl = isRoot ? "/api/properties" : `/api/properties?realtorId=${user.realtorId}`;
        const clientsUrl = isRoot ? "/api/clients" : `/api/clients?realtorId=${user.realtorId}`;
        const [propertiesRes, realtorsRes, categoriesRes, clientsRes] = await Promise.all([
          apiClient.get<ApiResponse<Property[]>>(propertiesUrl),
          isRoot ? apiClient.get<ApiResponse<Realtor[]>>("/api/realtors") : Promise.resolve(null),
          apiClient.get<ApiResponse<PropertyCategory[]>>("/api/property-categories"),
          apiClient.get<ApiResponse<Client[]>>(clientsUrl),
        ]);
        setProperties(propertiesRes.data.data);
        if (realtorsRes) setRealtors(realtorsRes.data.data);
        setCategories(categoriesRes.data.data);
        setClients(clientsRes.data.data);
        setError(null);
        if (!options?.silent) {
          MessageHandler.normal(dispatch, t("properties.countMessage", { count: propertiesRes.data.data.length }));
        }
      } catch {
        setError(t("properties.loadError"));
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

  const realtorNames = useMemo(
    () =>
      realtors.reduce<Record<string, string>>((map, realtor) => {
        map[realtor.id] = `${realtor.firstName} ${realtor.lastName}`;
        return map;
      }, {}),
    [realtors]
  );

  const categoryNames = useMemo(
    () =>
      categories.reduce<Record<string, string>>((map, category) => {
        map[category.id] = category.name;
        return map;
      }, {}),
    [categories]
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
  // fight with. The text field matches against the owner's name and the location fields, per an
  // explicit request that it search "on owner, location" rather than the listing title.
  const filteredProperties = useMemo(() => {
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;
    const search = searchText.trim().toLowerCase();

    return properties.filter((property) => {
      if (typeFilter && property.transactionType !== typeFilter) return false;
      if (statusFilter && property.status !== statusFilter) return false;
      if (categoryFilter && property.propertyCategoryId !== categoryFilter) return false;
      if (min !== null && !Number.isNaN(min) && property.price < min) return false;
      if (max !== null && !Number.isNaN(max) && property.price > max) return false;

      if (search) {
        const ownerName = property.clientId ? owners[property.clientId]?.name ?? "" : "";
        const haystack = [ownerName, property.city, property.region, property.address, property.neighborhood]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });
  }, [properties, typeFilter, statusFilter, categoryFilter, minPrice, maxPrice, searchText, owners]);

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{t("properties.pageTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("properties.pageSubtitle")}</p>
        </div>
        {canEdit && <Button onClick={() => router.push("/properties/new")}>{t("properties.newListing")}</Button>}
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("properties.loading")}</p>
      ) : (
        <>
          <PropertySearchBar
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categories={categories}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            minPrice={minPrice}
            onMinPriceChange={setMinPrice}
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
            searchText={searchText}
            onSearchTextChange={setSearchText}
          />
          <PropertyTable
            properties={filteredProperties}
            realtorNames={realtorNames}
            categoryNames={categoryNames}
            owners={owners}
            showRealtorColumn={isRoot}
            canEdit={canEdit}
            onView={(property) => router.push(`/properties/${property.id}/view`)}
            onEdit={(property) => router.push(`/properties/${property.id}`)}
            onDelete={setPropertyToDelete}
            onMedia={(property) => router.push(`/properties/${property.id}/media`)}
          />
        </>
      )}

      <DeletePropertyModal
        isOpen={!!propertyToDelete}
        property={propertyToDelete}
        onClose={() => setPropertyToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
