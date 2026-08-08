"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { useTranslation } from "@/store/hooks";
import type { ApiResponse, Land, LandCategory, Property, PropertyCategory } from "@/lib/types";
import OwnsTable, { type OwnedListing } from "./OwnsTable";

interface OwnsPanelProps {
  clientId: string;
}

// Read-only — Property/Land already have their own full CRUD elsewhere (/properties/[id],
// /lands/[id]); this tab just surfaces what this client owns (Property.clientId/Land.clientId)
// and links out to those existing pages. See CLAUDE.md → "Owns (Client)".
export default function OwnsPanel({ clientId }: OwnsPanelProps) {
  const t = useTranslation();
  const router = useRouter();

  const [listings, setListings] = useState<OwnedListing[]>([]);
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
    Promise.all([
      apiClient.get<ApiResponse<Property[]>>(`/api/properties?clientId=${clientId}`),
      apiClient.get<ApiResponse<Land[]>>(`/api/lands?clientId=${clientId}`),
    ])
      .then(([propertiesRes, landsRes]) => {
        const properties: OwnedListing[] = propertiesRes.data.data.map((property) => ({
          kind: "Property",
          ...property,
        }));
        const lands: OwnedListing[] = landsRes.data.data.map((land) => ({ kind: "Land", ...land }));
        setListings(
          [...properties, ...lands].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        setError(null);
      })
      .catch(() => setError(t("owns.loadError")))
      .finally(() => setLoading(false));
  }, [clientId, t]);

  // Land has no view page of its own yet (see CLAUDE.md → "Land management"), so it navigates to
  // the edit page instead — same fallback LandTable's own row actions use.
  const handleView = (listing: OwnedListing) => {
    router.push(listing.kind === "Property" ? `/properties/${listing.id}/view` : `/lands/${listing.id}`);
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
