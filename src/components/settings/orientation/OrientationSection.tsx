"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, Orientation } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import OrientationTable from "./OrientationTable";
import AddOrientationModal from "./AddOrientationModal";
import EditOrientationModal from "./EditOrientationModal";
import DeleteOrientationModal from "./DeleteOrientationModal";

export default function OrientationSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.orientation");
  const [orientations, setOrientations] = useState<Orientation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [orientationToEdit, setOrientationToEdit] = useState<Orientation | null>(null);
  const [orientationToDelete, setOrientationToDelete] = useState<Orientation | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadOrientations = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<Orientation[]>>("/api/orientations");
        setOrientations(response.data.data);
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
    loadOrientations();
  }, [loadOrientations]);

  const reloadSilently = useCallback(() => loadOrientations({ silent: true }), [loadOrientations]);

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
        <OrientationTable
          orientations={orientations}
          onEdit={setOrientationToEdit}
          onDelete={setOrientationToDelete}
        />
      )}

      <AddOrientationModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditOrientationModal
        isOpen={!!orientationToEdit}
        orientation={orientationToEdit}
        onClose={() => setOrientationToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteOrientationModal
        isOpen={!!orientationToDelete}
        orientation={orientationToDelete}
        onClose={() => setOrientationToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
