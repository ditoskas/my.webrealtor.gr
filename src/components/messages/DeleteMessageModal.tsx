"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Message } from "@/lib/types";

interface DeleteMessageModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteMessageModal({ isOpen, message, onClose, onDeleted }: DeleteMessageModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!message) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/messages/${message.id}`);
      MessageHandler.success(dispatch, t("messages.deleteModal.success"));
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("messages.deleteModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !message) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      title={t("messages.deleteModal.title")}
      message={t("messages.deleteModal.confirm")}
      loading={loading}
      error={error}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
