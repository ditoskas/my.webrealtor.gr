"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ZoningType, ZoningTypeInput } from "@/lib/types";
import ZoningTypeForm from "./ZoningTypeForm";

interface EditZoningTypeModalProps {
  isOpen: boolean;
  zoningType: ZoningType | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditZoningTypeModal({
  isOpen,
  zoningType,
  onClose,
  onSaved,
}: EditZoningTypeModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ZoningTypeInput) => {
    if (!zoningType) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/zoning-types/${zoningType.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.zoningType"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !zoningType) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: zoningType.name })} onClose={onClose}>
      <ZoningTypeForm
        key={zoningType.id}
        initialValues={zoningType}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
