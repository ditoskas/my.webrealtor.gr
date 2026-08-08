"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { InterestFor } from "@/lib/types";
import { formatDate } from "@/lib/formatDate";
import sharedStyles from "@/styles/shared.module.scss";

interface DeleteInterestForModalProps {
  isOpen: boolean;
  clientId: string;
  interest: InterestFor | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteInterestForModal({
  isOpen,
  clientId,
  interest,
  onClose,
  onDeleted,
}: DeleteInterestForModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!interest) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/clients/${clientId}/interest-for/${interest.id}`);
      MessageHandler.success(dispatch, t("interestFor.deleteSuccess"));
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("interestFor.deleteError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !interest) return null;

  return (
    <Modal isOpen={isOpen} title={t("interestFor.deleteModalTitle")} onClose={onClose}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
      <p className="text-sm text-neutral-500 mb-4">
        {t("interestFor.deleteConfirm", { date: formatDate(interest.date) })}
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
