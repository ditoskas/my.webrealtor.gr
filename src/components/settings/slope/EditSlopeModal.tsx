"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Slope, SlopeInput } from "@/lib/types";
import SlopeForm from "./SlopeForm";

interface EditSlopeModalProps {
  isOpen: boolean;
  slope: Slope | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditSlopeModal({
  isOpen,
  slope,
  onClose,
  onSaved,
}: EditSlopeModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: SlopeInput) => {
    if (!slope) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/slopes/${slope.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.slope"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !slope) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: slope.name })} onClose={onClose}>
      <SlopeForm
        key={slope.id}
        initialValues={slope}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
