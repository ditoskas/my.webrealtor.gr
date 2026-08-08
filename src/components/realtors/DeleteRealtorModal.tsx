"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

interface DeleteRealtorModalProps {
  isOpen: boolean;
  realtor: Realtor | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteRealtorModal({ isOpen, realtor, onClose, onDeleted }: DeleteRealtorModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!realtor) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/realtors/${realtor.id}`);
      MessageHandler.success(
        dispatch,
        t("realtors.deleteModal.success", { name: `${realtor.firstName} ${realtor.lastName}` })
      );
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("realtors.deleteModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !realtor) return null;

  return (
    <Modal isOpen={isOpen} title={t("realtors.deleteModal.title")} onClose={onClose}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
      <p className="text-sm text-neutral-500 mb-4">
        {t("realtors.deleteModal.confirm", { name: `${realtor.firstName} ${realtor.lastName}` })}
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
