"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, FloorType } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import FloorTypeTable from "./FloorTypeTable";
import AddFloorTypeModal from "./AddFloorTypeModal";
import EditFloorTypeModal from "./EditFloorTypeModal";
import DeleteFloorTypeModal from "./DeleteFloorTypeModal";

export default function FloorTypeSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.floorType");
  const [floorTypes, setFloorTypes] = useState<FloorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [floorTypeToEdit, setFloorTypeToEdit] = useState<FloorType | null>(null);
  const [floorTypeToDelete, setFloorTypeToDelete] = useState<FloorType | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadFloorTypes = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<FloorType[]>>("/api/floor-types");
        setFloorTypes(response.data.data);
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
    loadFloorTypes();
  }, [loadFloorTypes]);

  const reloadSilently = useCallback(() => loadFloorTypes({ silent: true }), [loadFloorTypes]);

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
        <FloorTypeTable
          floorTypes={floorTypes}
          onEdit={setFloorTypeToEdit}
          onDelete={setFloorTypeToDelete}
        />
      )}

      <AddFloorTypeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditFloorTypeModal
        isOpen={!!floorTypeToEdit}
        floorType={floorTypeToEdit}
        onClose={() => setFloorTypeToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteFloorTypeModal
        isOpen={!!floorTypeToDelete}
        floorType={floorTypeToDelete}
        onClose={() => setFloorTypeToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
