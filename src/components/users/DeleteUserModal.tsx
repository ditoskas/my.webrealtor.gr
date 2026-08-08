"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { User } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

interface DeleteUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteUserModal({ isOpen, user, onClose, onDeleted }: DeleteUserModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/users/${user.id}`);
      MessageHandler.success(dispatch, t("users.deleteModal.success", { email: user.email }));
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("users.deleteModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Modal isOpen={isOpen} title={t("users.deleteModal.title")} onClose={onClose}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
      <p className="text-sm text-neutral-500 mb-4">{t("users.deleteModal.confirm", { email: user.email })}</p>
      <div className="flex gap-2">
        <Button variant="danger" onClick={handleConfirm} disabled={loading}>
          {loading ? t("common.deleting") : t("common.delete")}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {t("common.cancel")}
        </Button>
      </div>
    </Modal>
  );
}
