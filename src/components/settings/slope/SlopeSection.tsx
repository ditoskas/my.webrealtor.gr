"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, Slope } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import SlopeTable from "./SlopeTable";
import AddSlopeModal from "./AddSlopeModal";
import EditSlopeModal from "./EditSlopeModal";
import DeleteSlopeModal from "./DeleteSlopeModal";

export default function SlopeSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.slope");
  const [slopes, setSlopes] = useState<Slope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [slopeToEdit, setSlopeToEdit] = useState<Slope | null>(null);
  const [slopeToDelete, setSlopeToDelete] = useState<Slope | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadSlopes = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<Slope[]>>("/api/slopes");
        setSlopes(response.data.data);
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
    loadSlopes();
  }, [loadSlopes]);

  const reloadSilently = useCallback(() => loadSlopes({ silent: true }), [loadSlopes]);

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
        <SlopeTable
          slopes={slopes}
          onEdit={setSlopeToEdit}
          onDelete={setSlopeToDelete}
        />
      )}

      <AddSlopeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditSlopeModal
        isOpen={!!slopeToEdit}
        slope={slopeToEdit}
        onClose={() => setSlopeToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteSlopeModal
        isOpen={!!slopeToDelete}
        slope={slopeToDelete}
        onClose={() => setSlopeToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
