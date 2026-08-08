"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, HeatingSystem } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import HeatingSystemTable from "./HeatingSystemTable";
import AddHeatingSystemModal from "./AddHeatingSystemModal";
import EditHeatingSystemModal from "./EditHeatingSystemModal";
import DeleteHeatingSystemModal from "./DeleteHeatingSystemModal";

export default function HeatingSystemSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [heatingSystems, setHeatingSystems] = useState<HeatingSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [heatingSystemToEdit, setHeatingSystemToEdit] = useState<HeatingSystem | null>(null);
  const [heatingSystemToDelete, setHeatingSystemToDelete] = useState<HeatingSystem | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadHeatingSystems = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<HeatingSystem[]>>("/api/heating-systems");
        setHeatingSystems(response.data.data);
        setError(null);
        if (!options?.silent) {
          MessageHandler.normal(dispatch, t("settingsPool.countMessage", { label: t("settingsEntities.heatingSystem"), count: response.data.data.length }));
        }
      } catch {
        setError(t("settingsPool.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadHeatingSystems();
  }, [loadHeatingSystems]);

  const reloadSilently = useCallback(() => loadHeatingSystems({ silent: true }), [loadHeatingSystems]);

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{t("settings.heatingSystem.sectionTitle")}</h3>
          <p className="text-sm text-neutral-500">{t("settings.heatingSystem.sectionSubtitle")}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>{t("settingsPool.addModalTitle", { label: t("settingsEntities.heatingSystem") })}</Button>
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("settingsPool.loading")}</p>
      ) : (
        <HeatingSystemTable
          heatingSystems={heatingSystems}
          onEdit={setHeatingSystemToEdit}
          onDelete={setHeatingSystemToDelete}
        />
      )}

      <AddHeatingSystemModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditHeatingSystemModal
        isOpen={!!heatingSystemToEdit}
        heatingSystem={heatingSystemToEdit}
        onClose={() => setHeatingSystemToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteHeatingSystemModal
        isOpen={!!heatingSystemToDelete}
        heatingSystem={heatingSystemToDelete}
        onClose={() => setHeatingSystemToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
