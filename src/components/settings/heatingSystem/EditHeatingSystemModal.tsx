"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { HeatingSystem, HeatingSystemInput } from "@/lib/types";
import HeatingSystemForm from "./HeatingSystemForm";

interface EditHeatingSystemModalProps {
  isOpen: boolean;
  heatingSystem: HeatingSystem | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditHeatingSystemModal({
  isOpen,
  heatingSystem,
  onClose,
  onSaved,
}: EditHeatingSystemModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: HeatingSystemInput) => {
    if (!heatingSystem) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/heating-systems/${heatingSystem.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.heatingSystem"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !heatingSystem) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: heatingSystem.name })} onClose={onClose}>
      <HeatingSystemForm
        key={heatingSystem.id}
        initialValues={heatingSystem}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
