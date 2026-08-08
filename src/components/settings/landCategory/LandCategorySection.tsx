"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, LandCategory } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import LandCategoryTable from "./LandCategoryTable";
import AddLandCategoryModal from "./AddLandCategoryModal";
import EditLandCategoryModal from "./EditLandCategoryModal";
import DeleteLandCategoryModal from "./DeleteLandCategoryModal";

export default function LandCategorySection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.landCategory");
  const [landCategories, setLandCategories] = useState<LandCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [landCategoryToEdit, setLandCategoryToEdit] = useState<LandCategory | null>(null);
  const [landCategoryToDelete, setLandCategoryToDelete] = useState<LandCategory | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadLandCategories = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<LandCategory[]>>("/api/land-categories");
        setLandCategories(response.data.data);
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
    loadLandCategories();
  }, [loadLandCategories]);

  const reloadSilently = useCallback(() => loadLandCategories({ silent: true }), [loadLandCategories]);

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
        <LandCategoryTable
          landCategories={landCategories}
          onEdit={setLandCategoryToEdit}
          onDelete={setLandCategoryToDelete}
        />
      )}

      <AddLandCategoryModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditLandCategoryModal
        isOpen={!!landCategoryToEdit}
        landCategory={landCategoryToEdit}
        onClose={() => setLandCategoryToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteLandCategoryModal
        isOpen={!!landCategoryToDelete}
        landCategory={landCategoryToDelete}
        onClose={() => setLandCategoryToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
