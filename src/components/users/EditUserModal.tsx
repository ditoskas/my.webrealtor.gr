"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { User, UserInput } from "@/lib/types";
import UserForm from "./UserForm";

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditUserModal({ isOpen, user, onClose, onSaved }: EditUserModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: UserInput) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/users/${user.id}`, values);
      MessageHandler.success(dispatch, t("users.editModal.success", { email: values.email }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("users.addModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Modal isOpen={isOpen} title={t("users.editModal.title", { email: user.email })} onClose={onClose}>
      <UserForm
        key={user.id}
        isEdit
        initialValues={{ email: user.email, role: user.role, realtorId: user.realtorId ?? "" }}
        submitLabel={t("users.editModal.submitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
