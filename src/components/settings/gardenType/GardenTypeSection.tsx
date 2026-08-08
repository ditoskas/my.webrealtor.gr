"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, GardenType } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import GardenTypeTable from "./GardenTypeTable";
import AddGardenTypeModal from "./AddGardenTypeModal";
import EditGardenTypeModal from "./EditGardenTypeModal";
import DeleteGardenTypeModal from "./DeleteGardenTypeModal";

export default function GardenTypeSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.gardenType");
  const [gardenTypes, setGardenTypes] = useState<GardenType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [gardenTypeToEdit, setGardenTypeToEdit] = useState<GardenType | null>(null);
  const [gardenTypeToDelete, setGardenTypeToDelete] = useState<GardenType | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadGardenTypes = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<GardenType[]>>("/api/garden-types");
        setGardenTypes(response.data.data);
        setError(null);
        if (!options?.silent) {
          MessageHandler.normal(dispatch, t("settingsPool.countMessage", { label, count: response.data.data.length }));
        }
      } catch {
        setError(t("settingsPool.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, t, label]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadGardenTypes();
  }, [loadGardenTypes]);

  const reloadSilently = useCallback(() => loadGardenTypes({ silent: true }), [loadGardenTypes]);

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{label}</h3>
          <p className="text-sm text-neutral-500">{t("settingsPool.sectionSubtitle")}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>{t("settingsPool.addModalTitle", { label })}</Button>
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("settingsPool.loading")}</p>
      ) : (
        <GardenTypeTable
          gardenTypes={gardenTypes}
          onEdit={setGardenTypeToEdit}
          onDelete={setGardenTypeToDelete}
        />
      )}

      <AddGardenTypeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditGardenTypeModal
        isOpen={!!gardenTypeToEdit}
        gardenType={gardenTypeToEdit}
        onClose={() => setGardenTypeToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteGardenTypeModal
        isOpen={!!gardenTypeToDelete}
        gardenType={gardenTypeToDelete}
        onClose={() => setGardenTypeToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
