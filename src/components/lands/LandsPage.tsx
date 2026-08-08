"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCanEdit, useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Land, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import EntityDetailModal from "@/components/entityDetails/EntityDetailModal";
import LandTable from "./LandTable";
import LandSearchBar from "./LandSearchBar";
import DeleteLandModal from "./DeleteLandModal";

export default function LandsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();
  const user = useCurrentUser();
  const canEdit = useCanEdit();
  const isRoot = user?.role === "Root";

  const [lands, setLands] = useState<Land[]>([]);
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [landToDelete, setLandToDelete] = useState<Land | null>(null);
  const [landForDetails, setLandForDetails] = useState<Land | null>(null);

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Same silent-reload / page-load count message convention as PropertiesPage — see CLAUDE.md →
  // Footer notifications. Root fetches every realtor's listings plus the realtor list (to resolve
  // a Realtor column); Administrator/Operator only fetch their own realtor's listings.
  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) return;
      try {
        const landsUrl = isRoot ? "/api/lands" : `/api/lands?realtorId=${user.realtorId}`;
        const [landsRes, realtorsRes] = await Promise.all([
          apiClient.get<ApiResponse<Land[]>>(landsUrl),
          isRoot ? apiClient.get<ApiResponse<Realtor[]>>("/api/realtors") : Promise.resolve(null),
        ]);
        setLands(landsRes.data.data);
        if (realtorsRes) setRealtors(realtorsRes.data.data);
        setError(null);
        if (!options?.silent) {
          MessageHandler.normal(dispatch, t("land.countMessage", { count: landsRes.data.data.length }));
        }
      } catch {
        setError(t("land.loadError"));
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

  // Client-side filtering — the full scoped list is already loaded, so there's no pagination to
  // fight with. Same shape as PropertiesPage's filteredProperties, minus type/category (Land's
  // search only asks for status, location, and price).
  const filteredLands = useMemo(() => {
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;
    const search = location.trim().toLowerCase();

    return lands.filter((land) => {
      if (typeFilter && land.transactionType !== typeFilter) return false;
      if (statusFilter && land.status !== statusFilter) return false;
      if (min !== null && !Number.isNaN(min) && land.price < min) return false;
      if (max !== null && !Number.isNaN(max) && land.price > max) return false;

      if (search) {
        const haystack = [land.city, land.neighborhood, land.region, land.address]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });
  }, [lands, typeFilter, statusFilter, minPrice, maxPrice, location]);

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{t("land.pageTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("land.pageSubtitle")}</p>
        </div>
        {canEdit && <Button onClick={() => router.push("/lands/new")}>{t("land.newListing")}</Button>}
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("land.loading")}</p>
      ) : (
        <>
          <LandSearchBar
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            location={location}
            onLocationChange={setLocation}
            minPrice={minPrice}
            onMinPriceChange={setMinPrice}
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
          />
          <LandTable
            lands={filteredLands}
            realtorNames={realtorNames}
            showRealtorColumn={isRoot}
            canEdit={canEdit}
            onDetails={setLandForDetails}
            onEdit={(land) => router.push(`/lands/${land.id}`)}
            onDelete={setLandToDelete}
            onMedia={(land) => router.push(`/lands/${land.id}/media`)}
          />
        </>
      )}

      <DeleteLandModal
        isOpen={!!landToDelete}
        land={landToDelete}
        onClose={() => setLandToDelete(null)}
        onDeleted={reloadSilently}
      />
      <EntityDetailModal
        isOpen={!!landForDetails}
        onClose={() => setLandForDetails(null)}
        entityType="Land"
        entityId={landForDetails?.id ?? ""}
        entityLabel={
          landForDetails ? landForDetails.title || t("land.table.listingFallback", { id: landForDetails.id.slice(-6) }) : ""
        }
      />
    </div>
  );
}
