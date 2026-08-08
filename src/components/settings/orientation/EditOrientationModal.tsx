"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Orientation, OrientationInput } from "@/lib/types";
import OrientationForm from "./OrientationForm";

interface EditOrientationModalProps {
  isOpen: boolean;
  orientation: Orientation | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditOrientationModal({
  isOpen,
  orientation,
  onClose,
  onSaved,
}: EditOrientationModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: OrientationInput) => {
    if (!orientation) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/orientations/${orientation.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.orientation"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !orientation) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: orientation.name })} onClose={onClose}>
      <OrientationForm
        key={orientation.id}
        initialValues={orientation}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
