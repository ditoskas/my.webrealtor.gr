"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, EnergyClass } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import EnergyClassTable from "./EnergyClassTable";
import AddEnergyClassModal from "./AddEnergyClassModal";
import EditEnergyClassModal from "./EditEnergyClassModal";
import DeleteEnergyClassModal from "./DeleteEnergyClassModal";

export default function EnergyClassSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [energyClasses, setEnergyClasses] = useState<EnergyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [energyClassToEdit, setEnergyClassToEdit] = useState<EnergyClass | null>(null);
  const [energyClassToDelete, setEnergyClassToDelete] = useState<EnergyClass | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage — see CLAUDE.md →
  // Footer notifications.
  const loadEnergyClasses = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<EnergyClass[]>>("/api/energy-classes");
        setEnergyClasses(response.data.data);
        setError(null);
        if (!options?.silent) {
          MessageHandler.normal(dispatch, t("settingsPool.countMessage", { label: t("settingsEntities.energyClass"), count: response.data.data.length }));
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
    loadEnergyClasses();
  }, [loadEnergyClasses]);

  const reloadSilently = useCallback(() => loadEnergyClasses({ silent: true }), [loadEnergyClasses]);

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{t("settings.energyClass.sectionTitle")}</h3>
          <p className="text-sm text-neutral-500">{t("settings.energyClass.sectionSubtitle")}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>{t("settingsPool.addModalTitle", { label: t("settingsEntities.energyClass") })}</Button>
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("settingsPool.loading")}</p>
      ) : (
        <EnergyClassTable
          energyClasses={energyClasses}
          onEdit={setEnergyClassToEdit}
          onDelete={setEnergyClassToDelete}
        />
      )}

      <AddEnergyClassModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditEnergyClassModal
        isOpen={!!energyClassToEdit}
        energyClass={energyClassToEdit}
        onClose={() => setEnergyClassToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteEnergyClassModal
        isOpen={!!energyClassToDelete}
        energyClass={energyClassToDelete}
        onClose={() => setEnergyClassToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
