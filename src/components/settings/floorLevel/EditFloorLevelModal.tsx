"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { FloorLevel, FloorLevelInput } from "@/lib/types";
import FloorLevelForm from "./FloorLevelForm";

interface EditFloorLevelModalProps {
  isOpen: boolean;
  floorLevel: FloorLevel | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditFloorLevelModal({
  isOpen,
  floorLevel,
  onClose,
  onSaved,
}: EditFloorLevelModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: FloorLevelInput) => {
    if (!floorLevel) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/floor-levels/${floorLevel.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.floorLevel"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !floorLevel) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: floorLevel.name })} onClose={onClose}>
      <FloorLevelForm
        key={floorLevel.id}
        initialValues={floorLevel}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
