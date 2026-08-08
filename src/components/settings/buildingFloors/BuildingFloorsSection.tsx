"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, BuildingFloors } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import BuildingFloorsTable from "./BuildingFloorsTable";
import AddBuildingFloorsModal from "./AddBuildingFloorsModal";
import EditBuildingFloorsModal from "./EditBuildingFloorsModal";
import DeleteBuildingFloorsModal from "./DeleteBuildingFloorsModal";

export default function BuildingFloorsSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.buildingFloors");
  const [buildingFloorss, setBuildingFloorss] = useState<BuildingFloors[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [buildingFloorsToEdit, setBuildingFloorsToEdit] = useState<BuildingFloors | null>(null);
  const [buildingFloorsToDelete, setBuildingFloorsToDelete] = useState<BuildingFloors | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadBuildingFloorss = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<BuildingFloors[]>>("/api/building-floors");
        setBuildingFloorss(response.data.data);
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
    loadBuildingFloorss();
  }, [loadBuildingFloorss]);

  const reloadSilently = useCallback(() => loadBuildingFloorss({ silent: true }), [loadBuildingFloorss]);

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
        <BuildingFloorsTable
          buildingFloorss={buildingFloorss}
          onEdit={setBuildingFloorsToEdit}
          onDelete={setBuildingFloorsToDelete}
        />
      )}

      <AddBuildingFloorsModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditBuildingFloorsModal
        isOpen={!!buildingFloorsToEdit}
        buildingFloors={buildingFloorsToEdit}
        onClose={() => setBuildingFloorsToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteBuildingFloorsModal
        isOpen={!!buildingFloorsToDelete}
        buildingFloors={buildingFloorsToDelete}
        onClose={() => setBuildingFloorsToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
