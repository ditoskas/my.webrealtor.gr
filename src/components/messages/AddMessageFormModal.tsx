"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { MessageFormInput } from "@/lib/types";
import MessageFormForm from "./MessageFormForm";

interface AddMessageFormModalProps {
  isOpen: boolean;
  realtorId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddMessageFormModal({ isOpen, realtorId, onClose, onSaved }: AddMessageFormModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: MessageFormInput) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/api/message-forms", values);
      MessageHandler.success(dispatch, t("messageForms.addModal.success", { slug: values.slug }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("messageForms.addModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={t("messageForms.addModal.title")} onClose={onClose}>
      <MessageFormForm
        key="new"
        realtorId={realtorId}
        submitLabel={t("messageForms.addModal.submitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
