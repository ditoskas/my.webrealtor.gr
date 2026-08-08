"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { UserInput } from "@/lib/types";
import UserForm from "./UserForm";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddUserModal({ isOpen, onClose, onSaved }: AddUserModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: UserInput) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/api/users", values);
      MessageHandler.success(dispatch, t("users.addModal.success", { email: values.email }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("users.addModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={t("users.addModal.title")} onClose={onClose}>
      <UserForm
        key="new"
        submitLabel={t("users.addModal.submitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
