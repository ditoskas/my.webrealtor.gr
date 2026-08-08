"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { GardenType, GardenTypeInput } from "@/lib/types";
import GardenTypeForm from "./GardenTypeForm";

interface EditGardenTypeModalProps {
  isOpen: boolean;
  gardenType: GardenType | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditGardenTypeModal({
  isOpen,
  gardenType,
  onClose,
  onSaved,
}: EditGardenTypeModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: GardenTypeInput) => {
    if (!gardenType) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/garden-types/${gardenType.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.gardenType"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !gardenType) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: gardenType.name })} onClose={onClose}>
      <GardenTypeForm
        key={gardenType.id}
        initialValues={gardenType}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
