"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { PropertyCategory, PropertyCategoryInput } from "@/lib/types";
import PropertyCategoryForm from "./PropertyCategoryForm";

interface EditPropertyCategoryModalProps {
  isOpen: boolean;
  propertyCategory: PropertyCategory | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditPropertyCategoryModal({
  isOpen,
  propertyCategory,
  onClose,
  onSaved,
}: EditPropertyCategoryModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: PropertyCategoryInput) => {
    if (!propertyCategory) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/property-categories/${propertyCategory.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.propertyCategory"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !propertyCategory) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: propertyCategory.name })} onClose={onClose}>
      <PropertyCategoryForm
        key={propertyCategory.id}
        initialValues={propertyCategory}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
