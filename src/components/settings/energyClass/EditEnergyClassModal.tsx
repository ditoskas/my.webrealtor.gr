"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { EnergyClass, EnergyClassInput } from "@/lib/types";
import EnergyClassForm from "./EnergyClassForm";

interface EditEnergyClassModalProps {
  isOpen: boolean;
  energyClass: EnergyClass | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditEnergyClassModal({
  isOpen,
  energyClass,
  onClose,
  onSaved,
}: EditEnergyClassModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: EnergyClassInput) => {
    if (!energyClass) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/energy-classes/${energyClass.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.energyClass"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !energyClass) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: energyClass.name })} onClose={onClose}>
      <EnergyClassForm
        key={energyClass.id}
        initialValues={energyClass}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
