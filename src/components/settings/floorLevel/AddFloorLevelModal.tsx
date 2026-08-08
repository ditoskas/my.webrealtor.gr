"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { FloorLevelInput } from "@/lib/types";
import FloorLevelForm from "./FloorLevelForm";

interface AddFloorLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddFloorLevelModal({ isOpen, onClose, onSaved }: AddFloorLevelModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const label = t("settingsEntities.floorLevel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: FloorLevelInput) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/api/floor-levels", values);
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
      <FloorLevelForm
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
