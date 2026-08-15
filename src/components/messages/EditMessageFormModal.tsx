"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { MessageForm, MessageFormInput } from "@/lib/types";
import MessageFormFormComponent from "./MessageFormForm";

interface EditMessageFormModalProps {
  isOpen: boolean;
  messageForm: MessageForm | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditMessageFormModal({ isOpen, messageForm, onClose, onSaved }: EditMessageFormModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: MessageFormInput) => {
    if (!messageForm) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/message-forms/${messageForm.id}`, values);
      MessageHandler.success(dispatch, t("messageForms.editModal.success", { slug: values.slug }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("messageForms.addModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !messageForm) return null;

  return (
    <Modal isOpen={isOpen} title={t("messageForms.editModal.title", { slug: messageForm.slug })} onClose={onClose}>
      <MessageFormFormComponent
        key={messageForm.id}
        realtorId={messageForm.realtorId}
        guid={messageForm.guid}
        initialValues={messageForm}
        submitLabel={t("messageForms.editModal.submitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
