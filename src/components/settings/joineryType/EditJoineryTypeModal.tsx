"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { JoineryType, JoineryTypeInput } from "@/lib/types";
import JoineryTypeForm from "./JoineryTypeForm";

interface EditJoineryTypeModalProps {
  isOpen: boolean;
  joineryType: JoineryType | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditJoineryTypeModal({
  isOpen,
  joineryType,
  onClose,
  onSaved,
}: EditJoineryTypeModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: JoineryTypeInput) => {
    if (!joineryType) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/joinery-types/${joineryType.id}`, values);
      MessageHandler.success(dispatch, t("settingsPool.updatedMessage", { label: t("settingsEntities.joineryType"), name: values.name }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !joineryType) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.editModalTitle", { name: joineryType.name })} onClose={onClose}>
      <JoineryTypeForm
        key={joineryType.id}
        initialValues={joineryType}
        submitLabel={t("settingsPool.editSubmitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
