"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { FloorType, FloorTypeInput } from "@/lib/types";
import FloorTypeForm from "./FloorTypeForm";

interface EditFloorTypeModalProps {
  isOpen: boolean;
  floorType: FloorType | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditFloorTypeModal({
  isOpen,
  floorType,
  onClose,
  onSaved,
}: EditFloorTypeModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: FloorTypeInput) => {
    if (!floorType) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/floor-types/${floorType.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.floorType"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !floorType) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: floorType.name })} onClose={onClose}>
      <FloorTypeForm
        key={floorType.id}
        initialValues={floorType}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
