"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { HeatingMedium, HeatingMediumInput } from "@/lib/types";
import HeatingMediumForm from "./HeatingMediumForm";

interface EditHeatingMediumModalProps {
  isOpen: boolean;
  heatingMedium: HeatingMedium | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditHeatingMediumModal({
  isOpen,
  heatingMedium,
  onClose,
  onSaved,
}: EditHeatingMediumModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: HeatingMediumInput) => {
    if (!heatingMedium) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/heating-mediums/${heatingMedium.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.heatingMedium"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !heatingMedium) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: heatingMedium.name })} onClose={onClose}>
      <HeatingMediumForm
        key={heatingMedium.id}
        initialValues={heatingMedium}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
