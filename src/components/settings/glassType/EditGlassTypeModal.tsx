"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { GlassType, GlassTypeInput } from "@/lib/types";
import GlassTypeForm from "./GlassTypeForm";

interface EditGlassTypeModalProps {
  isOpen: boolean;
  glassType: GlassType | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditGlassTypeModal({
  isOpen,
  glassType,
  onClose,
  onSaved,
}: EditGlassTypeModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: GlassTypeInput) => {
    if (!glassType) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/glass-types/${glassType.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.glassType"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !glassType) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: glassType.name })} onClose={onClose}>
      <GlassTypeForm
        key={glassType.id}
        initialValues={glassType}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
