"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, PropertyCategory } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import PropertyCategoryTable from "./PropertyCategoryTable";
import AddPropertyCategoryModal from "./AddPropertyCategoryModal";
import EditPropertyCategoryModal from "./EditPropertyCategoryModal";
import DeletePropertyCategoryModal from "./DeletePropertyCategoryModal";

export default function PropertyCategorySection() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.propertyCategory");
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [propertyCategoryToEdit, setPropertyCategoryToEdit] = useState<PropertyCategory | null>(null);
  const [propertyCategoryToDelete, setPropertyCategoryToDelete] = useState<PropertyCategory | null>(null);

  // Same silent-reload / page-load count message convention as RealtorsPage/EnergyClassSection —
  // see CLAUDE.md → Footer notifications.
  const loadPropertyCategories = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<PropertyCategory[]>>("/api/property-categories");
        setPropertyCategories(response.data.data);
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
    loadPropertyCategories();
  }, [loadPropertyCategories]);

  const reloadSilently = useCallback(() => loadPropertyCategories({ silent: true }), [loadPropertyCategories]);

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
        <PropertyCategoryTable
          propertyCategories={propertyCategories}
          onEdit={setPropertyCategoryToEdit}
          onDelete={setPropertyCategoryToDelete}
        />
      )}

      <AddPropertyCategoryModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditPropertyCategoryModal
        isOpen={!!propertyCategoryToEdit}
        propertyCategory={propertyCategoryToEdit}
        onClose={() => setPropertyCategoryToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeletePropertyCategoryModal
        isOpen={!!propertyCategoryToDelete}
        propertyCategory={propertyCategoryToDelete}
        onClose={() => setPropertyCategoryToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
