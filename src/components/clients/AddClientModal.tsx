"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ClientInput } from "@/lib/types";
import ClientForm from "./ClientForm";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddClientModal({ isOpen, onClose, onSaved }: AddClientModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ClientInput) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/api/clients", values);
      MessageHandler.success(dispatch, t("clients.addModal.success", { name: `${values.firstName} ${values.lastName}` }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("clients.addModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={t("clients.addModal.title")} onClose={onClose}>
      <ClientForm
        key="new"
        submitLabel={t("clients.addModal.submitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
