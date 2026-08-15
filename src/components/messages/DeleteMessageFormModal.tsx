"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { MessageForm } from "@/lib/types";

interface DeleteMessageFormModalProps {
  isOpen: boolean;
  messageForm: MessageForm | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteMessageFormModal({
  isOpen,
  messageForm,
  onClose,
  onDeleted,
}: DeleteMessageFormModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!messageForm) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/message-forms/${messageForm.id}`);
      MessageHandler.success(dispatch, t("messageForms.deleteModal.success", { slug: messageForm.slug }));
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("messageForms.deleteModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !messageForm) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      title={t("messageForms.deleteModal.title")}
      message={t("messageForms.deleteModal.confirm", { slug: messageForm.slug })}
      loading={loading}
      error={error}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
