"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { useCanEdit, useTranslation } from "@/store/hooks";
import type { ApiResponse, InterestFor, LandCategory, PropertyCategory } from "@/lib/types";
import InterestForTable from "./InterestForTable";
import AddInterestForModal from "./AddInterestForModal";
import EditInterestForModal from "./EditInterestForModal";
import DeleteInterestForModal from "./DeleteInterestForModal";

interface InterestForPanelProps {
  clientId: string;
}

// The actual Interest For UI (fetch + table + add/edit/delete modals) — embedded as the first tab
// of EntityDetailTabs, Client only (unlike Notes/Files this entity is Client-scoped, not
// polymorphic across all four attachable entities).
export default function InterestForPanel({ clientId }: InterestForPanelProps) {
  const t = useTranslation();
  const canEdit = useCanEdit();

  const [interests, setInterests] = useState<InterestFor[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const [landCategories, setLandCategories] = useState<LandCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [interestToEdit, setInterestToEdit] = useState<InterestFor | null>(null);
  const [interestToDelete, setInterestToDelete] = useState<InterestFor | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<ApiResponse<PropertyCategory[]>>("/api/property-categories"),
      apiClient.get<ApiResponse<LandCategory[]>>("/api/land-categories"),
    ]).then(([propertyRes, landRes]) => {
      setPropertyCategories(propertyRes.data.data);
      setLandCategories(landRes.data.data);
    });
  }, []);

  const loadInterests = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const response = await apiClient.get<ApiResponse<InterestFor[]>>(`/api/clients/${clientId}/interest-for`);
      setInterests(response.data.data);
      setError(null);
    } catch {
      setError(t("interestFor.loadError"));
    } finally {
      setLoading(false);
    }
  }, [clientId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / entity-change, see NotesPanel for the general pattern
    loadInterests();
  }, [loadInterests]);

  const reloadSilently = useCallback(() => {
    loadInterests();
  }, [loadInterests]);

  return (
    <div>
      {error && <p className="text-sm text-rose-500 mb-2">{error}</p>}

      {canEdit && (
        <Button variant="outline" className="mb-4" onClick={() => setIsAddOpen(true)}>
          <Plus size={14} />
          <span>{t("interestFor.addButton")}</span>
        </Button>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("interestFor.loading")}</p>
      ) : (
        <InterestForTable
          interests={interests}
          propertyCategories={propertyCategories}
          landCategories={landCategories}
          onEdit={setInterestToEdit}
          onDelete={setInterestToDelete}
        />
      )}

      <AddInterestForModal
        isOpen={isAddOpen}
        clientId={clientId}
        propertyCategories={propertyCategories}
        landCategories={landCategories}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditInterestForModal
        isOpen={!!interestToEdit}
        clientId={clientId}
        interest={interestToEdit}
        propertyCategories={propertyCategories}
        landCategories={landCategories}
        onClose={() => setInterestToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteInterestForModal
        isOpen={!!interestToDelete}
        clientId={clientId}
        interest={interestToDelete}
        onClose={() => setInterestToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
