"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, GlassType } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import GlassTypeTable from "./GlassTypeTable";
import AddGlassTypeModal from "./AddGlassTypeModal";
import EditGlassTypeModal from "./EditGlassTypeModal";
import DeleteGlassTypeModal from "./DeleteGlassTypeModal";

export default function GlassTypeSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.glassType");
  const [glassTypes, setGlassTypes] = useState<GlassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [glassTypeToEdit, setGlassTypeToEdit] = useState<GlassType | null>(null);
  const [glassTypeToDelete, setGlassTypeToDelete] = useState<GlassType | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadGlassTypes = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<GlassType[]>>("/api/glass-types");
        setGlassTypes(response.data.data);
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
    loadGlassTypes();
  }, [loadGlassTypes]);

  const reloadSilently = useCallback(() => loadGlassTypes({ silent: true }), [loadGlassTypes]);

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
        <GlassTypeTable
          glassTypes={glassTypes}
          onEdit={setGlassTypeToEdit}
          onDelete={setGlassTypeToDelete}
        />
      )}

      <AddGlassTypeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditGlassTypeModal
        isOpen={!!glassTypeToEdit}
        glassType={glassTypeToEdit}
        onClose={() => setGlassTypeToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteGlassTypeModal
        isOpen={!!glassTypeToDelete}
        glassType={glassTypeToDelete}
        onClose={() => setGlassTypeToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
