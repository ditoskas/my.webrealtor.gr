"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, HeatingMedium } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import HeatingMediumTable from "./HeatingMediumTable";
import AddHeatingMediumModal from "./AddHeatingMediumModal";
import EditHeatingMediumModal from "./EditHeatingMediumModal";
import DeleteHeatingMediumModal from "./DeleteHeatingMediumModal";

export default function HeatingMediumSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.heatingMedium");
  const [heatingMediums, setHeatingMediums] = useState<HeatingMedium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [heatingMediumToEdit, setHeatingMediumToEdit] = useState<HeatingMedium | null>(null);
  const [heatingMediumToDelete, setHeatingMediumToDelete] = useState<HeatingMedium | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadHeatingMediums = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<HeatingMedium[]>>("/api/heating-mediums");
        setHeatingMediums(response.data.data);
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
    loadHeatingMediums();
  }, [loadHeatingMediums]);

  const reloadSilently = useCallback(() => loadHeatingMediums({ silent: true }), [loadHeatingMediums]);

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
        <HeatingMediumTable
          heatingMediums={heatingMediums}
          onEdit={setHeatingMediumToEdit}
          onDelete={setHeatingMediumToDelete}
        />
      )}

      <AddHeatingMediumModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditHeatingMediumModal
        isOpen={!!heatingMediumToEdit}
        heatingMedium={heatingMediumToEdit}
        onClose={() => setHeatingMediumToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteHeatingMediumModal
        isOpen={!!heatingMediumToDelete}
        heatingMedium={heatingMediumToDelete}
        onClose={() => setHeatingMediumToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
