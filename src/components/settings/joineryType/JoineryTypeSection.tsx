"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, JoineryType } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import JoineryTypeTable from "./JoineryTypeTable";
import AddJoineryTypeModal from "./AddJoineryTypeModal";
import EditJoineryTypeModal from "./EditJoineryTypeModal";
import DeleteJoineryTypeModal from "./DeleteJoineryTypeModal";

export default function JoineryTypeSection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.joineryType");
  const [joineryTypes, setJoineryTypes] = useState<JoineryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [joineryTypeToEdit, setJoineryTypeToEdit] = useState<JoineryType | null>(null);
  const [joineryTypeToDelete, setJoineryTypeToDelete] = useState<JoineryType | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadJoineryTypes = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<JoineryType[]>>("/api/joinery-types");
        setJoineryTypes(response.data.data);
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
    loadJoineryTypes();
  }, [loadJoineryTypes]);

  const reloadSilently = useCallback(() => loadJoineryTypes({ silent: true }), [loadJoineryTypes]);

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
        <JoineryTypeTable
          joineryTypes={joineryTypes}
          onEdit={setJoineryTypeToEdit}
          onDelete={setJoineryTypeToDelete}
        />
      )}

      <AddJoineryTypeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditJoineryTypeModal
        isOpen={!!joineryTypeToEdit}
        joineryType={joineryTypeToEdit}
        onClose={() => setJoineryTypeToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteJoineryTypeModal
        isOpen={!!joineryTypeToDelete}
        joineryType={joineryTypeToDelete}
        onClose={() => setJoineryTypeToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
