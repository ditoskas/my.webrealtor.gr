"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Client } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

interface DeleteClientModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteClientModal({ isOpen, client, onClose, onDeleted }: DeleteClientModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/clients/${client.id}`);
      MessageHandler.success(dispatch, t("clients.deleteModal.success", { name: `${client.firstName} ${client.lastName}` }));
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("clients.deleteModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <Modal isOpen={isOpen} title={t("clients.deleteModal.title")} onClose={onClose}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
      <p className="text-sm text-neutral-500 mb-4">
        {t("clients.deleteModal.confirm", { name: `${client.firstName} ${client.lastName}` })}
      </p>
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
