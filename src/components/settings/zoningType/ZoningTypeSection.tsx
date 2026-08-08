"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, ZoningType } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import ZoningTypeTable from "./ZoningTypeTable";
import AddZoningTypeModal from "./AddZoningTypeModal";
import EditZoningTypeModal from "./EditZoningTypeModal";
import DeleteZoningTypeModal from "./DeleteZoningTypeModal";

export default function ZoningTypeSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.zoningType");
  const [zoningTypes, setZoningTypes] = useState<ZoningType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [zoningTypeToEdit, setZoningTypeToEdit] = useState<ZoningType | null>(null);
  const [zoningTypeToDelete, setZoningTypeToDelete] = useState<ZoningType | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadZoningTypes = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<ZoningType[]>>("/api/zoning-types");
        setZoningTypes(response.data.data);
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
    loadZoningTypes();
  }, [loadZoningTypes]);

  const reloadSilently = useCallback(() => loadZoningTypes({ silent: true }), [loadZoningTypes]);

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
        <ZoningTypeTable
          zoningTypes={zoningTypes}
          onEdit={setZoningTypeToEdit}
          onDelete={setZoningTypeToDelete}
        />
      )}

      <AddZoningTypeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditZoningTypeModal
        isOpen={!!zoningTypeToEdit}
        zoningType={zoningTypeToEdit}
        onClose={() => setZoningTypeToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteZoningTypeModal
        isOpen={!!zoningTypeToDelete}
        zoningType={zoningTypeToDelete}
        onClose={() => setZoningTypeToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
