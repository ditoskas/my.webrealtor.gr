"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Transaction } from "@/lib/types";
import { formatDate } from "@/lib/formatDate";
import sharedStyles from "@/styles/shared.module.scss";

interface DeleteTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteTransactionModal({
  isOpen,
  transaction,
  onClose,
  onDeleted,
}: DeleteTransactionModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!transaction) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/transactions/${transaction.id}`);
      MessageHandler.success(dispatch, t("transactions.deleteSuccess"));
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("transactions.deleteError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <Modal isOpen={isOpen} title={t("transactions.deleteModalTitle")} onClose={onClose}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
      <p className="text-sm text-neutral-500 mb-4">
        {t("transactions.deleteConfirm", { date: formatDate(transaction.date) })}
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
