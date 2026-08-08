"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { BuildingFloorsInput } from "@/lib/types";
import BuildingFloorsForm from "./BuildingFloorsForm";

interface AddBuildingFloorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddBuildingFloorsModal({ isOpen, onClose, onSaved }: AddBuildingFloorsModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.buildingFloors");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: BuildingFloorsInput) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/api/building-floors", values);
      MessageHandler.success(dispatch, t("settingsPool.createdMessage", { label, name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.addModalTitle", { label })} onClose={onClose}>
      <BuildingFloorsForm
        key="new"
        submitLabel={t("settingsPool.addSubmitLabel", { label })}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
