"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { BuildingFloors, BuildingFloorsInput } from "@/lib/types";
import BuildingFloorsForm from "./BuildingFloorsForm";

interface EditBuildingFloorsModalProps {
  isOpen: boolean;
  buildingFloors: BuildingFloors | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditBuildingFloorsModal({
  isOpen,
  buildingFloors,
  onClose,
  onSaved,
}: EditBuildingFloorsModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: BuildingFloorsInput) => {
    if (!buildingFloors) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/building-floors/${buildingFloors.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.buildingFloors"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !buildingFloors) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: buildingFloors.name })} onClose={onClose}>
      <BuildingFloorsForm
        key={buildingFloors.id}
        initialValues={buildingFloors}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
