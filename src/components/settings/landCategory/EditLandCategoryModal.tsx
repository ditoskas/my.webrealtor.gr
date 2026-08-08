"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { LandCategory, LandCategoryInput } from "@/lib/types";
import LandCategoryForm from "./LandCategoryForm";

interface EditLandCategoryModalProps {
  isOpen: boolean;
  landCategory: LandCategory | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditLandCategoryModal({
  isOpen,
  landCategory,
  onClose,
  onSaved,
}: EditLandCategoryModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: LandCategoryInput) => {
    if (!landCategory) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/land-categories/${landCategory.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.landCategory"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !landCategory) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: landCategory.name })} onClose={onClose}>
      <LandCategoryForm
        key={landCategory.id}
        initialValues={landCategory}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
