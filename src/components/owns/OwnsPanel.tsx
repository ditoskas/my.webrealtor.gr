"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { useTranslation } from "@/store/hooks";
import type { ApiResponse, Asset, LandCategory, PropertyCategory } from "@/lib/types";
import OwnsTable from "./OwnsTable";

interface OwnsPanelProps {
  clientId: string;
}

// Read-only — Assets already have their own full CRUD elsewhere (/assets/[id]); this tab just
// surfaces what this client owns (Asset.clientId) and links out to the existing view/edit pages.
// See CLAUDE.md → "Owns (Client)".
export default function OwnsPanel({ clientId }: OwnsPanelProps) {
  const t = useTranslation();
  const router = useRouter();

  const [listings, setListings] = useState<Asset[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const [landCategories, setLandCategories] = useState<LandCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ApiResponse<PropertyCategory[]>>("/api/property-categories")
      .then((response) => setPropertyCategories(response.data.data))
      .catch(() => setPropertyCategories([]));
    apiClient
      .get<ApiResponse<LandCategory[]>>("/api/land-categories")
      .then((response) => setLandCategories(response.data.data))
      .catch(() => setLandCategories([]));
  }, []);

  useEffect(() => {
    if (!clientId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / entity-change, see NotesPanel for the general pattern
    setLoading(true);
    apiClient
      .get<ApiResponse<Asset[]>>(`/api/assets?clientId=${clientId}`)
      .then((response) => {
        setListings(
          [...response.data.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        setError(null);
      })
      .catch(() => setError(t("owns.loadError")))
      .finally(() => setLoading(false));
  }, [clientId, t]);

  const handleView = (listing: Asset) => {
    router.push(`/assets/${listing.id}/view`);
  };

  return (
    <div>
      {error && <p className="text-sm text-rose-500 mb-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("owns.loading")}</p>
      ) : (
        <OwnsTable
          listings={listings}
          propertyCategories={propertyCategories}
          landCategories={landCategories}
          onView={handleView}
        />
      )}
    </div>
  );
}
