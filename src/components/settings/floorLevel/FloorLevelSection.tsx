"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, FloorLevel } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import FloorLevelTable from "./FloorLevelTable";
import AddFloorLevelModal from "./AddFloorLevelModal";
import EditFloorLevelModal from "./EditFloorLevelModal";
import DeleteFloorLevelModal from "./DeleteFloorLevelModal";

export default function FloorLevelSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.floorLevel");
  const [floorLevels, setFloorLevels] = useState<FloorLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [floorLevelToEdit, setFloorLevelToEdit] = useState<FloorLevel | null>(null);
  const [floorLevelToDelete, setFloorLevelToDelete] = useState<FloorLevel | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadFloorLevels = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<FloorLevel[]>>("/api/floor-levels");
        setFloorLevels(response.data.data);
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
    loadFloorLevels();
  }, [loadFloorLevels]);

  const reloadSilently = useCallback(() => loadFloorLevels({ silent: true }), [loadFloorLevels]);

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
        <FloorLevelTable
          floorLevels={floorLevels}
          onEdit={setFloorLevelToEdit}
          onDelete={setFloorLevelToDelete}
        />
      )}

      <AddFloorLevelModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditFloorLevelModal
        isOpen={!!floorLevelToEdit}
        floorLevel={floorLevelToEdit}
        onClose={() => setFloorLevelToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteFloorLevelModal
        isOpen={!!floorLevelToDelete}
        floorLevel={floorLevelToDelete}
        onClose={() => setFloorLevelToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
