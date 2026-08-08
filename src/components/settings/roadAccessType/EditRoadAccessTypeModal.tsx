"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { RoadAccessType, RoadAccessTypeInput } from "@/lib/types";
import RoadAccessTypeForm from "./RoadAccessTypeForm";

interface EditRoadAccessTypeModalProps {
  isOpen: boolean;
  roadAccessType: RoadAccessType | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditRoadAccessTypeModal({
  isOpen,
  roadAccessType,
  onClose,
  onSaved,
}: EditRoadAccessTypeModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: RoadAccessTypeInput) => {
    if (!roadAccessType) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/road-access-types/${roadAccessType.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.roadAccessType"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !roadAccessType) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: roadAccessType.name })} onClose={onClose}>
      <RoadAccessTypeForm
        key={roadAccessType.id}
        initialValues={roadAccessType}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
