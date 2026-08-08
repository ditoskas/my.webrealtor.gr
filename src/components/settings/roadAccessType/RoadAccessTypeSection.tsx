"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, RoadAccessType } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import RoadAccessTypeTable from "./RoadAccessTypeTable";
import AddRoadAccessTypeModal from "./AddRoadAccessTypeModal";
import EditRoadAccessTypeModal from "./EditRoadAccessTypeModal";
import DeleteRoadAccessTypeModal from "./DeleteRoadAccessTypeModal";

export default function RoadAccessTypeSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.roadAccessType");
  const [roadAccessTypes, setRoadAccessTypes] = useState<RoadAccessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [roadAccessTypeToEdit, setRoadAccessTypeToEdit] = useState<RoadAccessType | null>(null);
  const [roadAccessTypeToDelete, setRoadAccessTypeToDelete] = useState<RoadAccessType | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadRoadAccessTypes = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<RoadAccessType[]>>("/api/road-access-types");
        setRoadAccessTypes(response.data.data);
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
    loadRoadAccessTypes();
  }, [loadRoadAccessTypes]);

  const reloadSilently = useCallback(() => loadRoadAccessTypes({ silent: true }), [loadRoadAccessTypes]);

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
        <RoadAccessTypeTable
          roadAccessTypes={roadAccessTypes}
          onEdit={setRoadAccessTypeToEdit}
          onDelete={setRoadAccessTypeToDelete}
        />
      )}

      <AddRoadAccessTypeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditRoadAccessTypeModal
        isOpen={!!roadAccessTypeToEdit}
        roadAccessType={roadAccessTypeToEdit}
        onClose={() => setRoadAccessTypeToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteRoadAccessTypeModal
        isOpen={!!roadAccessTypeToDelete}
        roadAccessType={roadAccessTypeToDelete}
        onClose={() => setRoadAccessTypeToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
